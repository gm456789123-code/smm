import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { verifyBankSlip, verifyTrueWallet } from '@/lib/easyslip';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const ERROR_MSG: Record<string, string> = {
  SLIP_NOT_FOUND:  'ไม่พบข้อมูลสลิป กรุณาตรวจสอบภาพให้ชัดเจน',
  QUOTA_EXCEEDED:  'ระบบตรวจสอบเกินโควต้า กรุณาลองใหม่ภายหลัง',
  INVALID_API_KEY: 'ระบบตรวจสอบขัดข้อง กรุณาติดต่อแอดมิน',
};

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ip = getClientIp(req);
  void ip;
  const rl = checkRateLimit(`verify-slip:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'คำขอมากเกินไป กรุณารอสักครู่' }, { status: 429 });

  const form     = await req.formData();
  const file     = form.get('file') as File | null;
  const slipType = String(form.get('type') ?? 'bank'); // 'bank' | 'truewallet'

  if (!file) return NextResponse.json({ error: 'กรุณาแนบไฟล์สลิป' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 5MB' }, { status: 400 });

  let ref: string;
  let amountThb: number;
  let senderName: string;
  let note: string;

  try {
    if (slipType === 'truewallet') {
      // TrueMoney Wallet / Angpao via v1
      const result = await verifyTrueWallet(file, file.name);
      if (result.status !== 200 || !result.data) {
        const code = result.message ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'สลิป TrueMoney ไม่ถูกต้อง' }, { status: 422 });
      }
      ref        = result.data.ref;
      amountThb  = result.data.amount;
      senderName = result.data.sender.name;
      const typeLabel = result.data.type === 'angpao' ? 'อั้งเปา' : 'TrueMoney Wallet';
      note = `${typeLabel}: ${senderName} → ${result.data.receiver.name} ฿${amountThb}`;
    } else {
      // Thai bank slip via v2
      const result = await verifyBankSlip(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'สลิปไม่ถูกต้อง' }, { status: 422 });
      }
      ref        = result.data.ref;
      amountThb  = result.data.amount.amount;
      senderName = result.data.sender.account.name.th || result.data.sender.account.name.en;
      note = `Bank: ${senderName} → ${result.data.receiver.account.name.th || result.data.receiver.account.name.en} ฿${amountThb}`;
    }
  } catch {
    return NextResponse.json({ error: 'ไม่สามารถเชื่อมต่อ EasySlip ได้' }, { status: 502 });
  }

  // Duplicate check
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
