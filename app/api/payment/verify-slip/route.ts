import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { verifySlip } from '@/lib/easyslip';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  const rl = checkRateLimit(`verify-slip:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'คำขอมากเกินไป กรุณารอสักครู่' }, { status: 429 });

  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'กรุณาแนบไฟล์สลิป' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 5MB' }, { status: 400 });

  let result;
  try {
    result = await verifySlip(file, file.name);
  } catch {
    return NextResponse.json({ error: 'ไม่สามารถเชื่อมต่อ EasySlip ได้' }, { status: 502 });
  }

  if (!result.success || !result.data) {
    const code = result.error?.code ?? 'UNKNOWN';
    const msg: Record<string, string> = {
      SLIP_NOT_FOUND:   'ไม่พบข้อมูลสลิป กรุณาตรวจสอบภาพให้ชัดเจน',
      QUOTA_EXCEEDED:   'ระบบตรวจสอบเกินโควต้า กรุณาลองใหม่ภายหลัง',
      INVALID_API_KEY:  'ระบบตรวจสอบขัดข้อง กรุณาติดต่อแอดมิน',
    };
    return NextResponse.json({ error: msg[code] ?? 'สลิปไม่ถูกต้อง' }, { status: 422 });
  }

  const { ref, amount: { amount: amountThb }, sender, receiver } = result.data;

  // Duplicate check
  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM transactions WHERE ref = ? LIMIT 1',
    [ref]
  );
  if ((existing as RowDataPacket[]).length > 0) {
    return NextResponse.json({ error: 'สลิปนี้ถูกใช้งานแล้ว' }, { status: 409 });
  }

  // Credit balance
  await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountThb, user.userId]);
  await db.query(
    `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
     VALUES (?, 'topup', ?, ?, 'completed', ?)`,
    [
      user.userId,
      amountThb,
      ref,
      `EasySlip: ${sender.account.name.th || sender.account.name.en} → ${receiver.account.name.th || receiver.account.name.en} ฿${amountThb}`,
    ]
  );

  return NextResponse.json({
    success:    true,
    amount:     amountThb,
    ref,
    senderName: sender.account.name.th || sender.account.name.en,
  });
}
