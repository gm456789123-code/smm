import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit } from '@/lib/rate-limit';
import { TmnVoucherClient } from '@prakrit_m/tmn-voucher';
import { sendAngpaoPendingAdminEmail } from '@/lib/email';

const voucherClient = new TmnVoucherClient();
const PHONE = process.env.TRUEMONEY_REDEEM_PHONE ?? '';
const ADMIN_EMAIL = process.env.SMTP_USER ?? '';

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
  VOUCHER_EXPIRED:        'ซองอั้งเปานี้หมดอายุแล้ว',
  VOUCHER_OUT_OF_STOCK:   'ซองอั้งเปานี้ถูกแลกครบแล้ว',
  VOUCHER_REDEEMED:       'ซองอั้งเปานี้ถูกแลกไปแล้ว',
  CANNOT_GET_OWN_VOUCHER: 'ไม่สามารถรับซองของตัวเองได้',
  INVALID_INPUT:          'รหัสหรือลิงก์ซองอั้งเปาไม่ถูกต้อง',
  TARGET_USER_NOT_FOUND:  'ไม่พบบัญชี TrueMoney ปลายทาง กรุณาติดต่อแอดมิน',
  MAINTENANCE:            'ระบบ TrueMoney อยู่ระหว่างปิดปรับปรุง กรุณาลองใหม่ภายหลัง',
  CONDITION_NOT_MET:      'ซองไม่ตรงเงื่อนไข กรุณาตรวจสอบมูลค่า',
};

// Codes that indicate the server is blocked (Cloudflare) → fall back to pending
const SERVER_BLOCKED_CODES = new Set(['INVALID_RESPONSE', 'NETWORK_ERROR', 'TIMEOUT']);

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

  // Prevent duplicate use / duplicate pending
  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id, tx_status FROM transactions WHERE ref = ? LIMIT 1',
    [`angpao:${code}`]
  );
  if (existing.length > 0) {
    const status = existing[0].tx_status;
    if (status === 'pending') {
      return NextResponse.json({ error: 'รหัสนี้อยู่ระหว่างรอแอดมินตรวจสอบแล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: 'ซองอั้งเปานี้ถูกใช้ไปแล้ว' }, { status: 409 });
  }

  let phone: string;
  try {
    phone = normalizePhone(PHONE);
  } catch {
    return NextResponse.json({ error: 'Receiver phone configuration is invalid.' }, { status: 500 });
  }

  // Try automatic redemption via TrueMoney API
  const url = `https://gift.truemoney.com/campaign/?v=${code}`;
  const result = await voucherClient.redeemVoucher(phone, url);

  // SUCCESS → credit immediately
  if (result.success) {
    const amountBaht = result.data.amount / 100;
    if (!amountBaht || amountBaht <= 0) {
      return NextResponse.json({ error: 'Voucher amount was not found.' }, { status: 422 });
    }
    await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountBaht, user.userId]);
    await db.query(
      `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
       VALUES (?, 'topup', ?, ?, 'completed', ?)`,
      [user.userId, amountBaht, `angpao:${code}`, `TrueMoney angpao ฿${amountBaht}`]
    );
    return NextResponse.json({ success: true, amount: amountBaht, ref: code });
  }

  console.error('[angpao] redeemVoucher failed:', result.code, result.message);

  // SERVER BLOCKED by Cloudflare → save pending, notify admin
  if (SERVER_BLOCKED_CODES.has(result.code)) {
    await db.query(
      `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
       VALUES (?, 'angpao', 0, ?, 'pending', ?)`,
      [user.userId, `angpao:${code}`, `Angpao pending | user: ${user.username} | code: ${code}`]
    );
    // Notify admin (non-blocking)
    if (ADMIN_EMAIL) {
      sendAngpaoPendingAdminEmail(ADMIN_EMAIL, user.username, code).catch(() => {});
    }
    return NextResponse.json({ pending: true, code }, { status: 202 });
  }

  // Known TrueMoney error → return message
  const errMsg = ERROR_MSG[result.code] ?? `แลกซองไม่สำเร็จ (${result.code}) กรุณาลองใหม่หรือติดต่อแอดมิน`;
  return NextResponse.json({ error: errMsg }, { status: 422 });
}
