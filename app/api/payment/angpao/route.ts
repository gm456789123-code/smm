import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit } from '@/lib/rate-limit';
import { TmnVoucherClient } from '@prakrit_m/tmn-voucher';

const voucherClient = new TmnVoucherClient();
const PHONE = process.env.TRUEMONEY_REDEEM_PHONE ?? '';

function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) digits = '0' + digits.slice(2);
  if (!/^0\d{9}$/.test(digits)) throw new Error('invalid phone');
  return digits;
}

function extractCode(input: string): string {
  const match = input.trim().match(/[?&]v=([A-Za-z0-9]+)/);
  return match ? match[1] : input.trim();
}

const ERROR_MSG: Record<string, string> = {
  VOUCHER_EXPIRED: 'This voucher has expired.',
  VOUCHER_OUT_OF_STOCK: 'This voucher has already been fully redeemed.',
  VOUCHER_REDEEMED: 'This voucher has already been redeemed.',
  CANNOT_GET_OWN_VOUCHER: 'You cannot redeem your own voucher.',
  INVALID_INPUT: 'The voucher code or link is invalid.',
  TARGET_USER_NOT_FOUND: 'The configured TrueMoney account was not found.',
};

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!PHONE) {
    return NextResponse.json({ error: 'Voucher receiver phone is not configured.' }, { status: 503 });
  }

  const rl = checkRateLimit(`angpao:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const { voucher } = await req.json().catch(() => ({}));
  if (!voucher) {
    return NextResponse.json({ error: 'Please provide a voucher link or code.' }, { status: 400 });
  }

  const code = extractCode(String(voucher));
  if (!/^[A-Za-z0-9]+$/.test(code)) {
    return NextResponse.json({ error: 'Voucher code format is invalid.' }, { status: 400 });
  }

  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM transactions WHERE ref = ? LIMIT 1',
    [`angpao:${code}`]
  );
  if (existing.length > 0) {
    return NextResponse.json({ error: 'This voucher has already been redeemed.' }, { status: 409 });
  }

  let phone: string;
  try {
    phone = normalizePhone(PHONE);
  } catch {
    return NextResponse.json({ error: 'Receiver phone configuration is invalid.' }, { status: 500 });
  }

  const url = `https://gift.truemoney.com/campaign/?v=${code}`;
  const result = await voucherClient.redeemVoucher(phone, url);
  if (!result.success) {
    return NextResponse.json({ error: ERROR_MSG[result.code] ?? 'Unable to redeem this voucher. Please try again.' }, { status: 422 });
  }

  const amountBaht = result.data.amount / 100;
  if (!amountBaht || amountBaht <= 0) {
    return NextResponse.json({ error: 'Voucher amount was not found.' }, { status: 422 });
  }

  await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountBaht, user.userId]);
  await db.query(
    `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
     VALUES (?, 'topup', ?, ?, 'completed', ?)`,
    [user.userId, amountBaht, `angpao:${code}`, `TrueMoney voucher THB ${amountBaht}`]
  );

  return NextResponse.json({ success: true, amount: amountBaht, ref: code });
}
