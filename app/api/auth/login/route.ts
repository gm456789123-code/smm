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

// Same bcrypt cost as real accounts; avoids a fast path for unknown users.
const DUMMY_PASSWORD_HASH = '$2b$12$m9BmXRmRforRvLLDuPgwauIfxBzfxTI3ER/jvJw0T7mRB9aIzz/F6';

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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    const { login, password } = body as Record<string, unknown>;
    if (
      typeof login !== 'string' || !login.trim() || login.length > 254 ||
      typeof password !== 'string' || !password
    ) {
      return NextResponse.json({ error: 'Please provide username/email and password.' }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, password_hash, role, email_verified FROM users WHERE username = ? OR email = ?',
      [login.trim(), login.trim()]
    );

    const user = rows[0];
    const valid = await comparePassword(password, user?.password_hash || DUMMY_PASSWORD_HASH);
    if (!user || !valid) {
      recordLoginFailure(`login-lock:${ip}`);
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
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
