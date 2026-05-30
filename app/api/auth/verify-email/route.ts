import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url));
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT ev.id, ev.user_id, ev.expires_at, ev.used, u.email, u.username
       FROM email_verifications ev
       JOIN users u ON ev.user_id = u.id
       WHERE ev.token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url));
    }

    const row = rows[0];
    if (row.used) {
      return NextResponse.redirect(new URL('/verify-email?error=used', req.url));
    }
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/verify-email?error=expired', req.url));
    }

    await db.query('UPDATE users SET email_verified = 1 WHERE id = ?', [row.user_id]);
    await db.query('UPDATE email_verifications SET used = 1 WHERE id = ?', [row.id]);

    await sendWelcomeEmail(row.email, row.username);

    return NextResponse.redirect(new URL('/verify-email?success=1', req.url));
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL('/verify-email?error=server', req.url));
  }
}
