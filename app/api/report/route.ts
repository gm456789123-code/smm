import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { getUploadDir } from '@/lib/upload-dir';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendAdminPush } from '@/lib/push';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, category, order_ref, detail, attachment_url, ticket_status, admin_note, created_at, updated_at
     FROM support_tickets
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [user.userId]
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`report:${user.userId}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'คุณส่งคำร้องบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });

  const category = String(form.get('category') ?? '');
  const orderId  = String(form.get('orderId') ?? '');
  const detail   = String(form.get('detail') ?? '');
  const file     = form.get('file') as File | null;

  if (!category || !detail.trim()) {
    return NextResponse.json({ error: 'กรุณาระบุประเภทปัญหาและรายละเอียด' }, { status: 400 });
  }
  if (detail.trim().length > 800) {
    return NextResponse.json({ error: 'รายละเอียดยาวเกินไป' }, { status: 400 });
  }

  let attachmentUrl: string | null = null;
  if (file && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'ไฟล์แนบต้องเป็นรูปภาพ (jpg, png, gif, webp)' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'ไฟล์แนบต้องไม่เกิน 5 MB' }, { status: 400 });
    }
    const ext = extname(file.name) || '.jpg';
    const name = `${randomUUID()}${ext}`;
    const dir = getUploadDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
    attachmentUrl = `/api/files/${name}`;
  }

  await db.query(
    `INSERT INTO support_tickets (user_id, category, order_ref, detail, attachment_url, ticket_status)
     VALUES (?, ?, ?, ?, ?, 'open')`,
    [user.userId, category, orderId.trim() || null, detail.trim(), attachmentUrl]
  );

  sendAdminPush({
    title: '🎫 มี Ticket แจ้งปัญหาใหม่',
    body: `[${category}] จากคุณ ${user.username}: ${detail.trim().slice(0, 80)}`,
    url: '/admin/tickets',
    tag: 'ticket-new',
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
