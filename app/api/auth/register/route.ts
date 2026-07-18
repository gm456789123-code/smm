import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '@/lib/db';
import { generateReferralCode, hashPassword, setAuthCookie } from '@/lib/auth';
import { signToken } from '@/lib/jwt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface RegisterBody {
  username: string;
  email: string;
  phone?: string;
  password: string;
  referralCode?: string;
  hp?: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body: RegisterBody = await req.json();
    const { username, email, phone, password, referralCode } = body;

    // Honeypot — bots fill hidden fields, humans don't
    if (body.hp) {
      return NextResponse.json({ message: 'Registration successful.' }, { status: 201 });
    }

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'username, email, and password are required.' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: 'username must be 3–30 characters.' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'username may contain only a-z, 0-9, and _.' }, { status: 400 });
    }

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });
    }

    if (password.length > 128) {
      return NextResponse.json({ error: 'รหัสผ่านยาวเกินไป (สูงสุด 128 ตัว)' }, { status: 400 });
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว' }, { status: 400 });
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว' }, { status: 400 });
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: 'รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว' }, { status: 400 });
    }

    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'This username or email is already in use.' }, { status: 409 });
    }

    let referredById: number | null = null;
    if (referralCode) {
      const [refRows] = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE referral_code = ?',
        [referralCode]
      );
      if (refRows.length > 0) {
        referredById = refRows[0].id;
      }
    }

    const passwordHash = await hashPassword(password);
    const myReferralCode = generateReferralCode(username);

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO users (username, email, phone, password_hash, referral_code, referred_by, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [username, email, phone ?? null, passwordHash, myReferralCode, referredById]
    );

    const userId = result.insertId;
    const jwtToken = await signToken({ userId, username, email, role: 'user', emailVerified: true });

    const res = NextResponse.json({ message: 'Registration successful.' }, { status: 201 });
    setAuthCookie(res, jwtToken);
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[register]', message);

    if (message.includes('ER_DUP_ENTRY')) {
      return NextResponse.json({ error: 'This username or email is already in use.' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
