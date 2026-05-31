import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

async function getUser(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  return token ? await verifyToken(token) : null;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id,username,email,phone,balance,role,referral_code,created_at FROM users WHERE id=?',
    [user.userId]
  );
  if (!rows[0]) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { phone } = await req.json();
  await db.query<ResultSetHeader>('UPDATE users SET phone=? WHERE id=?', [phone, user.userId]);
  return NextResponse.json({ ok: true });
}
