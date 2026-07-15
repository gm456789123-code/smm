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
    `SELECT t.id, t.user_id, u.username, t.amount, t.ref, t.tx_status, t.note, t.created_at
     FROM transactions t
     JOIN users u ON u.id = t.user_id
     WHERE t.tx_type = 'topup'
     ORDER BY t.created_at DESC
     LIMIT 500`
  );
  return NextResponse.json(rows);
}
