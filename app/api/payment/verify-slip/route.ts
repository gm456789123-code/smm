import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { verifyBankSlip, verifyTrueWallet } from '@/lib/easyslip';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit } from '@/lib/rate-limit';

const ERROR_MSG: Record<string, string> = {
  SLIP_NOT_FOUND:        'ไม่พบข้อมูลสลิป กรุณาตรวจสอบภาพให้ชัดเจน',
  SLIP_PENDING:          'สลิปยังประมวลผลไม่เสร็จ (กรุณารอ ~5 นาทีแล้วลองใหม่)',
  QUOTA_EXCEEDED:        'ระบบตรวจสอบเกินโควต้า กรุณาลองใหม่ภายหลัง',
  INVALID_API_KEY:       'ระบบตรวจสอบขัดข้อง กรุณาติดต่อแอดมิน',
  IMAGE_SIZE_TOO_LARGE:  'ไฟล์ใหญ่เกินไป กรุณาใช้ภาพที่เล็กกว่า 4MB',
  INVALID_IMAGE_FORMAT:  'รูปแบบไฟล์ไม่รองรับ กรุณาใช้ JPEG/PNG/WebP',
  INVALID_IMAGE:         'ภาพไม่ใช่สลิป TrueMoney ที่ถูกต้อง',
};

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`verify-slip:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'คำขอมากเกินไป กรุณารอสักครู่' }, { status: 429 });

  const form     = await req.formData();
  const file     = form.get('file') as File | null;
  const slipType = String(form.get('type') ?? 'bank');

  if (!file) return NextResponse.json({ error: 'กรุณาแนบไฟล์สลิป' }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 4MB' }, { status: 400 });

  let ref:        string;
  let amountThb:  number;
  let senderName: string;
  let note:       string;
  let isDuplicate: boolean;

  try {
    if (slipType === 'truewallet') {
      const result = await verifyTrueWallet(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'สลิป TrueMoney ไม่ถูกต้อง' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup } = result.data;
      ref        = rawSlip.transactionId;
      amountThb  = amountInSlip;
      senderName = rawSlip.sender.name;
      isDuplicate = dup;
      note = `TrueMoney: ${senderName} → ${rawSlip.receiver.name} ฿${amountThb}`;
    } else {
      const result = await verifyBankSlip(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'สลิปไม่ถูกต้อง' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup } = result.data;
      ref        = rawSlip.transRef;
      amountThb  = amountInSlip;
      senderName = rawSlip.sender.account.name.th || rawSlip.sender.account.name.en || 'ไม่ทราบชื่อ';
      isDuplicate = dup;
      const receiverName = rawSlip.receiver.account.name.th || rawSlip.receiver.account.name.en || '';
      note = `Bank (${rawSlip.sender.bank.short}→${rawSlip.receiver.bank.short}): ${senderName} → ${receiverName} ฿${amountThb}`;
    }
  } catch {
    return NextResponse.json({ error: 'ไม่สามารถเชื่อมต่อ EasySlip ได้' }, { status: 502 });
  }

  // EasySlip detected duplicate
  if (isDuplicate) {
    return NextResponse.json({ error: 'สลิปนี้ถูกใช้งานแล้ว' }, { status: 409 });
  }

  // Double-check in our DB (cross-user protection)
  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM transactions WHERE ref = ? LIMIT 1',
    [ref]
  );
  if ((existing as RowDataPacket[]).length > 0) {
    return NextResponse.json({ error: 'สลิปนี้ถูกใช้งานแล้ว' }, { status: 409 });
  }

  await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountThb, user.userId]);
  await db.query(
    `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
     VALUES (?, 'topup', ?, ?, 'completed', ?)`,
    [user.userId, amountThb, ref, note]
  );

  return NextResponse.json({ success: true, amount: amountThb, ref, senderName });
}
