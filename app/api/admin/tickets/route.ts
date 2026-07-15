import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function requireAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.id, t.user_id, u.username, t.category, t.order_ref, t.detail,
            t.ticket_status, t.admin_note, t.created_at, t.updated_at
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     ORDER BY FIELD(t.ticket_status, 'open', 'in_progress', 'closed'), t.created_at DESC
     LIMIT 200`
  );
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id, ticket_status, admin_note } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db.query(
    'UPDATE support_tickets SET ticket_status = ?, admin_note = ? WHERE id = ?',
    [ticket_status, admin_note ?? null, id]
  );
  return NextResponse.json({ ok: true });
}
