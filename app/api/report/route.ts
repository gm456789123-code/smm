import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`report:${user.userId}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'คุณส่งคำร้องบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });

  const { category, orderId, detail } = await req.json().catch(() => ({}));
  if (!category || !detail?.trim()) {
    return NextResponse.json({ error: 'กรุณาระบุประเภทปัญหาและรายละเอียด' }, { status: 400 });
  }
  if (detail.trim().length > 800) {
    return NextResponse.json({ error: 'รายละเอียดยาวเกินไป' }, { status: 400 });
  }

  await db.query(
    `INSERT INTO support_tickets (user_id, category, order_ref, detail, ticket_status)
     VALUES (?, ?, ?, ?, 'open')`,
    [user.userId, category, orderId?.trim() || null, detail.trim()]
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
