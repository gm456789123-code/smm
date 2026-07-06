import { NextRequest, NextResponse } from 'next/server';
import { comparePassword, getRequestUser, hashPassword } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function PUT(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '?????????????????????' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: '????????????????????????? 6 ???' }, { status: 400 });
  }

  const [rows] = await db.query<RowDataPacket[]>('SELECT password_hash FROM users WHERE id=?', [user.userId]);
  if (!rows[0]) {
    return NextResponse.json({ error: '???????????' }, { status: 404 });
  }

  const valid = await comparePassword(currentPassword, rows[0].password_hash);
  if (!valid) {
    return NextResponse.json({ error: '??????????????????????????' }, { status: 401 });
  }

  const hash = await hashPassword(newPassword);
  await db.query<ResultSetHeader>('UPDATE users SET password_hash=? WHERE id=?', [hash, user.userId]);
  return NextResponse.json({ ok: true });
}
