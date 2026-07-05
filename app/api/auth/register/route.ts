import { NextRequest, NextResponse } from 'next/server';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import db from '@/lib/db';
import { hashPassword, generateReferralCode } from '@/lib/auth';
import { signToken } from '@/lib/jwt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

interface RegisterBody {
  username: string;
  email: string;
  phone?: string;
  password: string;
  referralCode?: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json({ error: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
    }

    const body: RegisterBody = await req.json();
    const { username, email, phone, password, referralCode } = body;

    if (!username || !email || !password)
      return NextResponse.json({ error: 'username, email, password จำเป็น' }, { status: 400 });

    if (username.length < 3 || username.length > 30)
      return NextResponse.json({ error: 'username ต้อง 3–30 ตัวอักษร' }, { status: 400 });

    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return NextResponse.json({ error: 'username ใช้ได้เฉพาะ a-z, 0-9, _' }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: 'password ต้องอย่างน้อย 6 ตัวอักษร' }, { status: 400 });

    if (password.length > 128)
      return NextResponse.json({ error: 'password ยาวเกินไป (สูงสุด 128 ตัวอักษร)' }, { status: 400 });;

    // Check duplicate
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0)
      return NextResponse.json({ error: 'username หรือ email นี้มีผู้ใช้แล้ว' }, { status: 409 });

    // Resolve referral
    let referredById: number | null = null;
    if (referralCode) {
      const [refRows] = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE referral_code = ?',
        [referralCode]
      );
      if (refRows.length > 0) referredById = refRows[0].id;
    }

    const passwordHash  = await hashPassword(password);
    const myReferralCode = generateReferralCode(username);

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO users (username, email, phone, password_hash, referral_code, referred_by, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [username, email, phone ?? null, passwordHash, myReferralCode, referredById]
    );

    const userId = result.insertId;

    const jwtToken = await signToken({ userId, username, email, role: 'user', emailVerified: true });
    const res = NextResponse.json({ message: 'สมัครสมาชิกสำเร็จ' }, { status: 201 });
    res.cookies.set('auth_token', jwtToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 60 * 60 * 24 * 7, path: '/',
    });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[register]', msg);

    if (msg.includes('ER_DUP_ENTRY'))
      return NextResponse.json({ error: 'username หรือ email นี้มีผู้ใช้แล้ว' }, { status: 409 });

    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
