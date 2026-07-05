import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';
import {
  checkRateLimit,
  clearLoginFailures,
  getClientIp,
  getLoginLockState,
  recordLoginFailure,
} from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    const lock = getLoginLockState(`login-lock:${ip}`);
    if (lock.locked) {
      return NextResponse.json({ error: 'ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่' }, { status: 429 });
    }

    const rl = checkRateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: 'คำขอมากเกินไป กรุณารอสักครู่' }, { status: 429 });
    }

    const { login, password } = await req.json();
    if (!login || !password) {
      return NextResponse.json({ error: 'กรุณากรอก username/email และ password' }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, role, email_verified FROM users WHERE username = ? OR email = ?',
      [login, login]
    );

    if (rows.length === 0) {
      recordLoginFailure(`login-lock:${ip}`);
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      recordLoginFailure(`login-lock:${ip}`);
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.email_verified),
    });

    clearLoginFailures(`login-lock:${ip}`);

    const res = NextResponse.json({ message: 'เข้าสู่ระบบสำเร็จ' });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
