import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.id, t.user_id, t.tx_type, t.amount, t.ref, t.tx_status, t.note,
            t.provider, t.api_failed, t.api_error, t.service_id, t.link_url, t.qty, t.created_at,
            u.username
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     ORDER BY t.created_at DESC
     LIMIT 300`
  );
  return NextResponse.json(rows);
}
