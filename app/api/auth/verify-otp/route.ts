import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { meSmS } from '@/lib/sms';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRl = checkRateLimit(`verify-otp-ip:${ip}`, 15, 10 * 60 * 1000);
    if (!ipRl.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRl = checkRateLimit(`verify-otp-user:${user.userId}`, 8, 10 * 60 * 1000);
    if (!userRl.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { otp, ref } = await req.json();
    if (!otp || !ref) {
      return NextResponse.json({ error: 'OTP code and reference are required.' }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM otp_verifications WHERE user_id=? AND ref_code=? AND verified=0 ORDER BY created_at DESC LIMIT 1',
      [user.userId, ref]
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'OTP reference was not found.' }, { status: 400 });
    }

    if (new Date(rows[0].expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired.' }, { status: 400 });
    }

    await meSmS.verifyOTP(rows[0].phone, ref, String(otp));

    await db.query('UPDATE otp_verifications SET verified=1 WHERE id=?', [rows[0].id]);
    await db.query('UPDATE users SET email_verified=1 WHERE id=?', [user.userId]);

    return NextResponse.json({ success: true, message: 'OTP verification completed successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[verify-otp]', message);

    if (message.includes('invalid') || message.includes('wrong') || message.includes('incorrect')) {
      return NextResponse.json({ error: 'The OTP code is invalid.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Unable to verify OTP right now. Please try again later.' }, { status: 500 });
  }
}

