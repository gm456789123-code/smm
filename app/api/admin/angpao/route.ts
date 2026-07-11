import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function requireAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET /api/admin/angpao — list pending angpao
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.id, t.user_id, t.amount, t.ref, t.tx_status, t.note, t.created_at,
            u.username, u.email
     FROM transactions t
     JOIN users u ON u.id = t.user_id
     WHERE t.tx_type = 'angpao'
     ORDER BY t.created_at DESC
     LIMIT 100`
  );
  return NextResponse.json(rows);
}
