import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { verifyBankSlip, verifyTrueWallet } from '@/lib/easyslip';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendTopupEmail } from '@/lib/email';

const ERROR_MSG: Record<string, string> = {
  SLIP_NOT_FOUND:        'ไม่พบข้อมูลสลิป กรุณาถ่ายภาพให้ชัดขึ้น',
  SLIP_PENDING:          'สลิปอยู่ระหว่างประมวลผล กรุณารอสักครู่แล้วลองใหม่',
  QUOTA_EXCEEDED:        'เกินโควต้าการตรวจสอบ กรุณาลองใหม่ภายหลัง',
  INVALID_API_KEY:       'ระบบตรวจสลิปผิดพลาด กรุณาติดต่อแอดมิน',
  IMAGE_SIZE_TOO_LARGE:  'รูปใหญ่เกินไป กรุณาอัปโหลดไฟล์ไม่เกิน 4MB',
  INVALID_IMAGE_FORMAT:  'รูปแบบไฟล์ไม่รองรับ ใช้ JPEG, PNG หรือ WebP',
  INVALID_IMAGE:         'รูปที่อัปโหลดไม่ใช่สลิป TrueMoney ที่ถูกต้อง',
};

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`verify-slip:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const slipType = String(form.get('type') ?? 'bank');

  if (!file) return NextResponse.json({ error: 'Please attach a slip file.' }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'File is larger than 4MB.' }, { status: 400 });

  let ref: string;
  let amountThb: number;
  let senderName: string;
  let note: string;
  let isDuplicate: boolean;

  try {
    if (slipType === 'truewallet') {
      const result = await verifyTrueWallet(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'Invalid TrueMoney slip.' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup, matchedAccount } = result.data;

      // EasySlip matchedAccount — fall back to receiver phone check
      const twLast4 = (process.env.NEXT_PUBLIC_TRUEWALLET_ID ?? '').slice(-4);
      const isOurTW = !!matchedAccount || rawSlip.receiver?.phone?.endsWith(twLast4);

      if (!isOurTW) {
        return NextResponse.json({
          error: 'สลิป TrueMoney ไม่ได้โอนมายังบัญชีของเรา กรุณาตรวจสอบเบอร์ปลายทาง',
        }, { status: 422 });
      }

      ref = rawSlip.transactionId;
      amountThb = amountInSlip;
      senderName = rawSlip.sender.name;
      isDuplicate = dup;
      note = `TrueMoney: ${senderName} -> ${rawSlip.receiver.name} THB ${amountThb}`;

    } else {
      const result = await verifyBankSlip(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'Invalid bank slip.' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup, matchedAccount } = result.data;

      // EasySlip matchedAccount (not returned on all plans) — fall back to proxy/account suffix check
      const proxy        = rawSlip.receiver?.account?.proxy;
      const ppLast4      = (process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER ?? '').slice(-4);
      const bankAccLast4 = (process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? '').replace(/[-\s]/g, '').slice(-4);
      const receiverBankAcc = rawSlip.receiver?.account?.bank?.account ?? '';

      const isOurAccount = !!matchedAccount
        || (proxy != null && proxy.account.endsWith(ppLast4))
        || (proxy == null && !!receiverBankAcc && receiverBankAcc.endsWith(bankAccLast4));

      if (!isOurAccount) {
        return NextResponse.json({
          error: 'สลิปไม่ได้โอนมายังบัญชีของเรา กรุณาตรวจสอบบัญชีปลายทาง',
        }, { status: 422 });
      }

      ref = rawSlip.transRef;
      amountThb = amountInSlip;
      senderName = rawSlip.sender.account.name.th || rawSlip.sender.account.name.en || 'Unknown sender';
      isDuplicate = dup;
      const receiverName = rawSlip.receiver.account.name.th || rawSlip.receiver.account.name.en || 'Unknown receiver';
      const receiverBank = rawSlip.receiver.bank?.short ?? proxy?.type ?? 'PromptPay';
      note = `Bank (${rawSlip.sender.bank.short}->${receiverBank}): ${senderName} -> ${receiverName} THB ${amountThb}`;
    }
  } catch {
    return NextResponse.json({ error: 'Unable to connect to EasySlip.' }, { status: 502 });
  }

  if (isDuplicate) {
    return NextResponse.json({ error: 'This slip has already been used.' }, { status: 409 });
  }

  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM transactions WHERE ref = ? LIMIT 1',
    [ref]
  );
  if (existing.length > 0) {
    return NextResponse.json({ error: 'This slip has already been used.' }, { status: 409 });
  }

  await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountThb, user.userId]);
  await db.query(
    `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
     VALUES (?, 'topup', ?, ?, 'completed', ?)`,
    [user.userId, amountThb, ref, note]
  );

  // Referral commission
  try {
    const [userRows] = await db.query<RowDataPacket[]>(
      'SELECT referred_by FROM users WHERE id = ?', [user.userId]
    );
    const referredBy = userRows[0]?.referred_by;
    if (referredBy) {
      const [settingRows] = await db.query<RowDataPacket[]>(
        "SELECT setting_value FROM site_settings WHERE setting_key = 'referral_commission_pct'"
      );
      const pct        = Number(settingRows[0]?.setting_value ?? 5);
      const commission = Math.round(amountThb * pct) / 100;
      if (commission > 0) {
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [commission, referredBy]);
        await db.query(
          `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
           VALUES (?, 'referral', ?, ?, 'completed', ?)`,
          [referredBy, commission, ref, `Commission ${pct}% จาก topup ฿${amountThb} (ref: ${user.username})`]
        );
      }
    }
  } catch { /* non-critical */ }

  if (user.email) {
    sendTopupEmail(user.email, user.username, amountThb, ref).catch(() => {});
  }

  return NextResponse.json({ success: true, amount: amountThb, ref, senderName });
}
