import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, setAuthCookie, signToken } from '@/lib/auth';
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
      return NextResponse.json({ error: 'Too many failed attempts. Please try again later.' }, { status: 429 });
    }

    const rl = checkRateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { login, password } = await req.json();
    if (!login || !password) {
      return NextResponse.json({ error: 'Please provide username/email and password.' }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, role, email_verified FROM users WHERE username = ? OR email = ?',
      [login, login]
    );

    if (rows.length === 0) {
      recordLoginFailure(`login-lock:${ip}`);
      return NextResponse.json({ error: 'User not found.' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      recordLoginFailure(`login-lock:${ip}`);
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.email_verified),
    });

    clearLoginFailures(`login-lock:${ip}`);

    const res = NextResponse.json({ message: 'Login successful.' });
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
