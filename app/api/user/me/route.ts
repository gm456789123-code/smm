import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id,username,email,phone,balance,role,referral_code,created_at FROM users WHERE id=?',
    [user.userId]
  );

  if (!rows[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { phone } = await req.json();
  await db.query<ResultSetHeader>('UPDATE users SET phone=? WHERE id=?', [phone, user.userId]);
  return NextResponse.json({ ok: true });
}
