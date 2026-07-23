import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import pool from '@/lib/db';

export type CreditResult =
  | { status: 'credited' }
  | { status: 'duplicate' }
  | { status: 'error'; message: string };

export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'ER_DUP_ENTRY'
  );
}

/**
 * Atomically credit user balance + insert a completed ledger row.
 * Relies on UNIQUE(ref) so concurrent credits with the same ref cannot double-pay.
 *
 * Flow:
 * 1. Lock any existing row by ref (FOR UPDATE)
 * 2. If completed → duplicate
 * 3. If pending and completeIfPending → upgrade + credit once
 * 4. Else insert new completed row + credit
 */
export async function creditTopupAtomic(opts: {
  userId: number;
  amount: number;
  ref: string;
  note: string;
  txType?: string;
  provider?: string | null;
  /** Pay referral commission using a separate unique ref: referral:{ref} */
  referral?: boolean;
  /**
   * If a pending row already holds this ref (e.g. angpao hold),
   * upgrade it to completed and credit instead of failing as duplicate.
   */
  completeIfPending?: boolean;
}): Promise<CreditResult> {
  const amount = Number(opts.amount);
  const ref = String(opts.ref ?? '').trim();
  const txType = opts.txType ?? 'topup';
  if (!ref || !Number.isFinite(amount) || amount <= 0) {
    return { status: 'error', message: 'Invalid amount or ref' };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query<RowDataPacket[]>(
      'SELECT id, user_id, tx_status FROM transactions WHERE ref = ? LIMIT 1 FOR UPDATE',
      [ref]
    );
    const row = existing[0];

    if (row) {
      if (row.tx_status === 'completed') {
        await conn.rollback();
        return { status: 'duplicate' };
      }

      if (row.tx_status === 'pending' && opts.completeIfPending) {
        if (Number(row.user_id) !== Number(opts.userId)) {
          await conn.rollback();
          return { status: 'error', message: 'Ref belongs to another user' };
        }

        await conn.query(
          `UPDATE transactions
           SET tx_type = ?, amount = ?, tx_status = 'completed', note = ?, provider = ?
           WHERE id = ? AND tx_status = 'pending'`,
          [txType, amount, opts.note, opts.provider ?? null, row.id]
        );

        const [userResult] = await conn.query<ResultSetHeader>(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [amount, opts.userId]
        );
        if ((userResult.affectedRows ?? 0) === 0) {
          await conn.rollback();
          return { status: 'error', message: 'User not found' };
        }

        if (opts.referral) {
          await applyReferralCommission(conn, opts.userId, amount, ref);
        }

        await conn.commit();
        return { status: 'credited' };
      }

      // pending without completeIfPending, cancelled, or other status
      await conn.rollback();
      return { status: 'duplicate' };
    }

    try {
      await conn.query(
        `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note, provider)
         VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
        [opts.userId, txType, amount, ref, opts.note, opts.provider ?? null]
      );
    } catch (err) {
      // Concurrent insert won the race
      if (isDuplicateKeyError(err)) {
        await conn.rollback();
        return { status: 'duplicate' };
      }
      throw err;
    }

    const [userResult] = await conn.query<ResultSetHeader>(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, opts.userId]
    );
    if ((userResult.affectedRows ?? 0) === 0) {
      await conn.rollback();
      return { status: 'error', message: 'User not found' };
    }

    if (opts.referral) {
      await applyReferralCommission(conn, opts.userId, amount, ref);
    }

    await conn.commit();
    return { status: 'credited' };
  } catch (err) {
    await conn.rollback();
    console.error('[creditTopupAtomic]', err);
    return { status: 'error', message: 'DB error' };
  } finally {
    conn.release();
  }
}

/**
 * Insert a pending ledger row with unique ref (e.g. angpao hold).
 * Returns duplicate if ref already exists.
 */
export async function insertPendingTx(opts: {
  userId: number;
  amount?: number;
  ref: string;
  note: string;
  txType: string;
}): Promise<CreditResult> {
  const ref = String(opts.ref ?? '').trim();
  if (!ref) return { status: 'error', message: 'Invalid ref' };

  try {
    await pool.query(
      `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [opts.userId, opts.txType, opts.amount ?? 0, ref, opts.note]
    );
    return { status: 'credited' };
  } catch (err) {
    if (isDuplicateKeyError(err)) return { status: 'duplicate' };
    console.error('[insertPendingTx]', err);
    return { status: 'error', message: 'DB error' };
  }
}

async function applyReferralCommission(
  conn: PoolConnection,
  userId: number,
  amountThb: number,
  topupRef: string
) {
  const [userRows] = await conn.query<RowDataPacket[]>(
    'SELECT referred_by, username FROM users WHERE id = ?',
    [userId]
  );
  const referredBy = userRows[0]?.referred_by as number | null | undefined;
  if (!referredBy) return;

  const [settingRows] = await conn.query<RowDataPacket[]>(
    "SELECT setting_value FROM site_settings WHERE setting_key = 'referral_commission_pct'"
  );
  const pct = Number(settingRows[0]?.setting_value ?? 5);
  const commission = Math.round(amountThb * pct) / 100;
  if (!(commission > 0)) return;

  // Separate unique ref so topup + commission can both exist under UNIQUE(ref)
  const referralRef = `referral:${topupRef}`;
  try {
    await conn.query(
      `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
       VALUES (?, 'referral', ?, ?, 'completed', ?)`,
      [
        referredBy,
        commission,
        referralRef,
        `Commission ${pct}% จาก topup ฿${amountThb} (ref: ${userRows[0]?.username ?? userId})`,
      ]
    );
    await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [
      commission,
      referredBy,
    ]);
  } catch (err) {
    // Already paid for this topup — safe to ignore under concurrent retries
    if (isDuplicateKeyError(err)) return;
    throw err;
  }
}
