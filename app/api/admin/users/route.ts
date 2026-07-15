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
    'SELECT id, username, email, phone, email_verified, role, balance, created_at FROM users ORDER BY created_at DESC'
  );
  return NextResponse.json(rows);
}
