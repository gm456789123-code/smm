import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { meSmS } from '@/lib/sms';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRl = checkRateLimit(`verify-otp-ip:${ip}`, 15, 10 * 60 * 1000);
    if (!ipRl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const token = req.cookies.get('auth_token')?.value;
    const user  = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRl = checkRateLimit(`verify-otp-user:${user.userId}`, 8, 10 * 60 * 1000);
    if (!userRl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { otp, ref } = await req.json();
    if (!otp || !ref) return NextResponse.json({ error: 'กรุณากรอก OTP' }, { status: 400 });

    // หา record
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM otp_verifications WHERE user_id=? AND ref_code=? AND verified=0 ORDER BY created_at DESC LIMIT 1',
      [user.userId, ref]
    );
    if (!rows[0]) return NextResponse.json({ error: 'ไม่พบ OTP นี้' }, { status: 400 });
    if (new Date(rows[0].expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP หมดอายุแล้ว' }, { status: 400 });
    }

    // ยืนยันกับ ME-SMS
    await meSmS.verifyOTP(rows[0].phone, ref, String(otp));

    // mark verified
    await db.query('UPDATE otp_verifications SET verified=1 WHERE id=?', [rows[0].id]);
    await db.query('UPDATE users SET email_verified=1 WHERE id=?', [user.userId]);

    return NextResponse.json({ success: true, message: 'ยืนยันเบอร์โทรสำเร็จ' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[verify-otp]', msg);
    if (msg.includes('invalid') || msg.includes('wrong') || msg.includes('incorrect')) {
      return NextResponse.json({ error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 });
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
