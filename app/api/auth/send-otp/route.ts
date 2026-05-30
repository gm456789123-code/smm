import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { meSmS } from '@/lib/sms';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const user  = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone } = await req.json();
    const msisdn = String(phone ?? '').replace(/[-\s]/g, '');
    if (!/^(0[6-9]\d{8}|66[6-9]\d{8})$/.test(msisdn)) {
      return NextResponse.json({ error: 'เบอร์โทรไม่ถูกต้อง' }, { status: 400 });
    }

    // Rate limit: max 3 OTP per 10 min
    const [recent] = await db.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM otp_verifications WHERE user_id=? AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)",
      [user.userId]
    );
    if (recent[0].cnt >= 3) {
      return NextResponse.json({ error: 'ส่ง OTP บ่อยเกินไป กรุณารอ 10 นาที' }, { status: 429 });
    }

    const result = await meSmS.sendOTP(msisdn);
    const ref       = result.data.ref;
    const expiresAt = new Date(result.data.expiredAt);

    await db.query(
      'INSERT INTO otp_verifications (user_id, phone, ref_code, expires_at) VALUES (?,?,?,?)',
      [user.userId, msisdn, ref, expiresAt]
    );

    // อัปเดตเบอร์โทรใน users
    await db.query('UPDATE users SET phone=? WHERE id=?', [msisdn, user.userId]);

    return NextResponse.json({ ref, expiredAt: result.data.expiredAt });
  } catch (e) {
    console.error('[send-otp]', e);
    return NextResponse.json({ error: 'ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
}
