import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();
    if (!login || !password) {
      return NextResponse.json({ error: 'กรุณากรอก username/email และ password' }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, role, email_verified FROM users WHERE username = ? OR email = ?',
      [login, login]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบบัญชีนี้' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }
    if (!user.email_verified) {
      return NextResponse.json({ error: 'กรุณายืนยัน email ก่อนเข้าสู่ระบบ' }, { status: 403 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.email_verified),
    });

    const res = NextResponse.json({ message: 'เข้าสู่ระบบสำเร็จ' });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
