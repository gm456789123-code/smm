import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { comparePassword, hashPassword } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function PUT(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword)
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
  if (newPassword.length < 6)
    return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องอย่างน้อย 6 ตัว' }, { status: 400 });

  const [rows] = await db.query<RowDataPacket[]>('SELECT password_hash FROM users WHERE id=?', [user.userId]);
  if (!rows[0]) return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 });

  const valid = await comparePassword(currentPassword, rows[0].password_hash);
  if (!valid) return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 401 });

  const hash = await hashPassword(newPassword);
  await db.query<ResultSetHeader>('UPDATE users SET password_hash=? WHERE id=?', [hash, user.userId]);
  return NextResponse.json({ ok: true });
}
