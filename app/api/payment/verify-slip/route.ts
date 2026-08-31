import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { verifyBankSlip, verifyTrueWallet } from '@/lib/easyslip';
import { creditTopupAtomic } from '@/lib/credit-topup';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendTopupEmail } from '@/lib/email';
import { sendAdminPush } from '@/lib/push';

import { getPaymentSettings } from '@/lib/payment-settings';

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
  let provider: string;

  const paymentSettings = await getPaymentSettings();

  try {
    if (slipType === 'truewallet') {
      const result = await verifyTrueWallet(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'Invalid TrueMoney slip.' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup, matchedAccount } = result.data;

      ref = rawSlip.transactionId;
      amountThb = amountInSlip;
      senderName = rawSlip.sender.name;
      isDuplicate = dup;
      provider = 'truewallet';
      note = `TrueMoney: ${senderName} -> ${rawSlip.receiver.name} THB ${amountThb}`;
    } else {
      const result = await verifyBankSlip(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'Invalid bank slip.' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup } = result.data;

      ref = rawSlip.transRef;
      amountThb = amountInSlip;
      senderName = rawSlip.sender.account?.name?.th || rawSlip.sender.account?.name?.en || 'Unknown sender';
      isDuplicate = dup;
      provider = 'bank';
      const receiverName = rawSlip.receiver.account?.name?.th || rawSlip.receiver.account?.name?.en || 'Unknown receiver';
      const receiverBank = rawSlip.receiver.bank?.short ?? rawSlip.receiver?.account?.proxy?.type ?? 'PromptPay';
      note = `Bank (${rawSlip.sender.bank?.short ?? 'Bank'}->${receiverBank}): ${senderName} -> ${receiverName} THB ${amountThb}`;
    }
  } catch {
    return NextResponse.json({ error: 'Unable to connect to EasySlip.' }, { status: 502 });
  }

  if (isDuplicate) {
    return NextResponse.json({ error: 'This slip has already been used.' }, { status: 409 });
  }

  if (!ref || !(amountThb > 0)) {
    return NextResponse.json({ error: 'Invalid slip data.' }, { status: 422 });
  }

  // Atomic credit + UNIQUE(ref) — concurrent uploads of same slip cannot double-pay
  const result = await creditTopupAtomic({
    userId: user.userId,
    amount: amountThb,
    ref,
    note,
    provider,
    referral: true,
  });

  if (result.status === 'duplicate') {
    return NextResponse.json({ error: 'This slip has already been used.' }, { status: 409 });
  }
  if (result.status === 'error') {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  if (user.email) {
    sendTopupEmail(user.email, user.username, amountThb, ref).catch(() => {});
  }

  sendAdminPush({
    title: '💰 เงินเข้าใหม่ (สลิปโอนเงิน)',
    body: `ผู้ใช้ ${user.username} เติมเงิน ฿${amountThb.toLocaleString('th-TH', { minimumFractionDigits: 2 })} (${senderName})`,
    url: '/admin/topups',
    tag: `topup-slip-${ref}`,
  }).catch(() => {});

  return NextResponse.json({ success: true, amount: amountThb, ref, senderName });
}
