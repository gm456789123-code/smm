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

let supportTicketsTableReady = false;
async function ensureSupportTicketsTable() {
  if (supportTicketsTableReady) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        order_ref VARCHAR(50) DEFAULT NULL,
        detail TEXT NOT NULL,
        attachment_url VARCHAR(255) DEFAULT NULL,
        ticket_status VARCHAR(20) DEFAULT 'open',
        admin_note TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_status (ticket_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [cols] = await db.query<RowDataPacket[]>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'support_tickets'
        AND column_name = 'attachment_url'
    `);
    if (cols.length === 0) {
      await db.query(`ALTER TABLE support_tickets ADD COLUMN attachment_url VARCHAR(255) DEFAULT NULL AFTER detail`).catch(() => {});
    }
    supportTicketsTableReady = true;
  } catch (e) {
    console.error('ensureSupportTicketsTable error:', e);
  }
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureSupportTicketsTable();
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, category, order_ref, detail, attachment_url, ticket_status, admin_note, created_at, updated_at
       FROM support_tickets
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.userId]
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('GET /api/report error:', err);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูล Ticket ได้' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`report:${user.userId}`, 10, 60 * 60 * 1000);
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
    return NextResponse.json({ error: 'รายละเอียดยาวเกินไป (สูงสุด 800 ตัวอักษร)' }, { status: 400 });
  }

  let attachmentUrl: string | null = null;
  if (file && file.size > 0) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'ไฟล์แนบต้องเป็นรูปภาพ (jpg, png, gif, webp)' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'ไฟล์แนบต้องไม่เกิน 5 MB' }, { status: 400 });
    }
    try {
      const ext = extname(file.name) || '.jpg';
      const name = `${randomUUID()}${ext}`;
      const dir = getUploadDir();
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
      attachmentUrl = `/api/files/${name}`;
    } catch (uploadErr) {
      console.error('Ticket upload error:', uploadErr);
      return NextResponse.json({ error: 'ไม่สามารถบันทึกไฟล์แนบได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
    }
  }

  try {
    await ensureSupportTicketsTable();
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
  } catch (dbErr: any) {
    console.error('Ticket insert error:', dbErr);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกคำร้อง กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
