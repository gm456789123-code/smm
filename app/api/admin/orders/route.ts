import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { syncOrderStatuses, type SyncOrder } from '@/lib/order-sync';
import { checkRateLimit } from '@/lib/rate-limit';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const shouldSync = req.nextUrl.searchParams.get('sync') === '1';
  if (!checkRateLimit(`admin-order-sync:${admin.userId}`, 12, 60_000).ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const [rows] = await db.query<(RowDataPacket & SyncOrder)[]>(
    `SELECT t.id, t.user_id, t.tx_type, t.amount, t.ref, t.tx_status, t.status_locked, t.note,
            t.provider, t.api_failed, t.api_error, t.service_id, t.link_url, t.qty, t.created_at,
            u.username, u.email
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     ORDER BY t.created_at DESC
     LIMIT 300`
  );
  const result = shouldSync ? await syncOrderStatuses(rows) : rows;
  return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
}
export async function PATCH(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id, tx_status, note, ref, status_locked } = await req.json();
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (tx_status !== undefined) {
      if (!['pending', 'in_progress', 'processing', 'completed', 'cancelled', 'failed', 'partial'].includes(tx_status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.push('tx_status = ?');
      values.push(tx_status);
      // A manual status change must not be silently overwritten by the next provider sync,
      // unless the admin explicitly opts back into auto-sync via status_locked: false.
      if (status_locked === undefined) {
        updates.push('status_locked = ?');
        values.push(1);
      }
    }
    if (status_locked !== undefined) {
      updates.push('status_locked = ?');
      values.push(status_locked ? 1 : 0);
    }
    if (note !== undefined) {
      if (typeof note !== 'string' || note.length > 5000) return NextResponse.json({ error: 'Invalid note' }, { status: 400 });
      updates.push('note = ?');
      values.push(note);
    }
    if (ref !== undefined) {
      if (ref !== null && (typeof ref !== 'string' || ref.length > 255)) return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
      updates.push('ref = ?');
      values.push(ref);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await db.query(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === 'create') {
      const userId   = Number(body.userId);
      const provider = String(body.provider ?? 'km-social').trim() || 'km-social';
      const ref      = String(body.ref ?? '').trim();
      const serviceName = String(body.serviceName ?? '').trim();
      const link     = String(body.link ?? '').trim();
      const qty      = body.qty !== undefined && body.qty !== null && body.qty !== '' ? Math.floor(Number(body.qty)) : null;
      const amount   = Number(body.amount ?? 0);
      const txStatus = String(body.txStatus ?? 'pending');
      const deductBalance = Boolean(body.deductBalance);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: 'กรุณาเลือกผู้ใช้' }, { status: 400 });
      }
      if (!ref) {
        return NextResponse.json({ error: 'กรุณาระบุเลขออเดอร์จาก Provider (ref)' }, { status: 400 });
      }
      if (!serviceName) {
        return NextResponse.json({ error: 'กรุณาระบุชื่อบริการ' }, { status: 400 });
      }
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: 'จำนวนเงินไม่ถูกต้อง' }, { status: 400 });
      }
      if (qty !== null && (!Number.isFinite(qty) || qty < 0)) {
        return NextResponse.json({ error: 'จำนวนไม่ถูกต้อง' }, { status: 400 });
      }
      if (!['pending', 'in_progress', 'processing', 'completed', 'cancelled', 'failed', 'partial'].includes(txStatus)) {
        return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [userRows] = await conn.query<RowDataPacket[]>(
          'SELECT id, username, balance FROM users WHERE id = ? LIMIT 1 FOR UPDATE',
          [userId],
        );
        const targetUser = userRows[0];
        if (!targetUser) {
          await conn.rollback();
          return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
        }

        if (deductBalance && amount > 0) {
          if (Number(targetUser.balance) < amount) {
            await conn.rollback();
            return NextResponse.json({ error: `ยอดเงินลูกค้าไม่พอ (คงเหลือ ฿${Number(targetUser.balance).toFixed(2)})` }, { status: 402 });
          }
          await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);
        }

        try {
          await conn.query(
            `INSERT INTO transactions
               (user_id, tx_type, amount, ref, tx_status, note, provider, service_id, link_url, qty)
             VALUES (?, 'spend', ?, ?, ?, ?, ?, NULL, ?, ?)`,
            [userId, amount, ref, txStatus, `${serviceName} | ${link}`, provider, link || null, qty],
          );
        } catch (err) {
          await conn.rollback();
          if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ error: 'เลขออเดอร์นี้ถูกใช้ไปแล้วในระบบ' }, { status: 409 });
          }
          throw err;
        }

        await conn.commit();
        return NextResponse.json({ success: true, username: targetUser.username }, { status: 201 });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    if (action === 'refund' && Number.isSafeInteger(id) && id > 0) {
      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.query<RowDataPacket[]>(
          'SELECT id, user_id, amount, tx_status, tx_type, note FROM transactions WHERE id = ? LIMIT 1 FOR UPDATE',
          [id],
        );
        const tx = rows[0];
        if (!tx || tx.tx_type !== 'spend') {
          await conn.rollback();
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        const refundRef = `refund:${id}`;
        const [existing] = await conn.query<RowDataPacket[]>(
          'SELECT id FROM transactions WHERE ref = ? LIMIT 1', [refundRef],
        );
        if (existing.length || tx.tx_status === 'refunded' || String(tx.note ?? '').includes('[คืนเงินแล้ว')) {
          await conn.rollback();
          return NextResponse.json({ error: 'ออเดอร์นี้ได้ทำการคืนเงินไปแล้ว' }, { status: 409 });
        }
        const refundAmount = Number(tx.amount);
        if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
          await conn.rollback();
          return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
        }
        await conn.query(
          "INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note) VALUES (?, 'refund', ?, ?, 'completed', ?)",
          [tx.user_id, refundAmount, refundRef, `Refund order ${id} by admin ${admin.userId}`],
        );
        const [credited] = await conn.query<ResultSetHeader>('UPDATE users SET balance = balance + ? WHERE id = ?', [refundAmount, tx.user_id]);
        if (credited.affectedRows !== 1) throw new Error('Refund account not found');
        await conn.query(
          "UPDATE transactions SET tx_status = 'cancelled', note = CONCAT(COALESCE(note, ''), ' [คืนเงินแล้ว ฿', ?, ' โดยแอดมิน]') WHERE id = ?",
          [refundAmount, id]
        );

        await conn.commit();
        return NextResponse.json({ success: true, refundAmount });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[admin/orders/POST]', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
