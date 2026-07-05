import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit } from '@/lib/rate-limit';

const lib = require('@prakrit_m/tmn-voucher');
const redeemVoucher: (phone: string, urlOrCode: string) => Promise<{ code: string; data?: { voucher?: { amount_baht?: number }; redeemed_amount_baht?: number } }> = lib.default || lib;

const PHONE = process.env.TRUEMONEY_REDEEM_PHONE ?? '';

function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('66') && digits.length === 11) digits = '0' + digits.slice(2);
  if (!/^0\d{9}$/.test(digits)) throw new Error('invalid phone');
  return digits;
}

function extractCode(input: string): string {
  const m = input.trim().match(/[?&]v=([A-Za-z0-9]+)/);
  return m ? m[1] : input.trim();
}

const ERROR_TH: Record<string, string> = {
  VOUCHER_EXPIRED:         'ซองอั้งเปาหมดอายุแล้ว',
  VOUCHER_OUT_OF_STOCK:    'ซองอั้งเปาถูกรับไปหมดแล้ว',
  VOUCHER_REDEEMED:        'ซองนี้ถูกรับไปแล้ว',
  CANNOT_GET_OWN_VOUCHER:  'ไม่สามารถรับซองของตัวเองได้',
  INVALID_INPUT:           'โค้ดหรือลิ้งไม่ถูกต้อง',
  TARGET_USER_NOT_FOUND:   'ไม่พบบัญชี TrueMoney',
};

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!PHONE) return NextResponse.json({ error: 'ระบบยังไม่ได้ตั้งค่าเบอร์รับซอง กรุณาติดต่อแอดมิน' }, { status: 503 });

  const rl = checkRateLimit(`angpao:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'คำขอมากเกินไป กรุณารอสักครู่' }, { status: 429 });

  const { voucher } = await req.json().catch(() => ({}));
  if (!voucher) return NextResponse.json({ error: 'กรุณาใส่ลิ้งหรือโค้ดซองอั้งเปา' }, { status: 400 });

  const code = extractCode(String(voucher));
  if (!/^[A-Za-z0-9]+$/.test(code)) {
    return NextResponse.json({ error: 'รูปแบบโค้ดไม่ถูกต้อง' }, { status: 400 });
  }

  // ป้องกัน redeem ซองเดิมซ้ำ (เช็คในฐานข้อมูลก่อน call API)
  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM transactions WHERE ref = ? LIMIT 1',
    [`angpao:${code}`]
  );
  if ((existing as RowDataPacket[]).length > 0) {
    return NextResponse.json({ error: 'ซองนี้ถูกรับไปแล้ว' }, { status: 409 });
  }

  let phone: string;
  try { phone = normalizePhone(PHONE); }
  catch { return NextResponse.json({ error: 'เบอร์รับซองในระบบไม่ถูกต้อง' }, { status: 500 }); }

  let result: Awaited<ReturnType<typeof redeemVoucher>>;
  try {
    const url = `https://gift.truemoney.com/campaign/?v=${code}`;
    result = await redeemVoucher(phone, url);
  } catch (e: unknown) {
    const data = (e as { response?: { data?: { code?: string } } })?.response?.data;
    const errCode = data?.code ?? 'ERROR';
    return NextResponse.json({ error: ERROR_TH[errCode] ?? 'ไม่สามารถรับซองได้ กรุณาลองใหม่' }, { status: 422 });
  }

  if (result.code !== 'SUCCESS') {
    return NextResponse.json({ error: ERROR_TH[result.code] ?? `รับซองไม่สำเร็จ (${result.code})` }, { status: 422 });
  }

  const amountBaht =
    result.data?.redeemed_amount_baht ??
    result.data?.voucher?.amount_baht ??
    0;

  if (!amountBaht || amountBaht <= 0) {
    return NextResponse.json({ error: 'ไม่พบมูลค่าซอง' }, { status: 422 });
  }

  await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountBaht, user.userId]);
  await db.query(
    `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
     VALUES (?, 'topup', ?, ?, 'completed', ?)`,
    [user.userId, amountBaht, `angpao:${code}`, `อั้งเปา TrueMoney ฿${amountBaht}`]
  );

  return NextResponse.json({ success: true, amount: amountBaht, ref: code });
}
