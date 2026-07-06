import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { signToken } from '@/lib/jwt';
import { hashPassword, setAuthCookie } from '@/lib/auth';

function getBaseUrl(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  return appUrl || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const redirect = (path: string) => NextResponse.redirect(`${baseUrl}${path}`);

  if (error || !code) {
    return redirect('/login?error=GoogleAuthFailed');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth credentials missing' }, { status: 500 });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Google Token Error:', tokenData);
      return redirect('/login?error=GoogleTokenError');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    if (!userData.email) {
      return redirect('/login?error=NoEmailProvided');
    }

    const email = userData.email;

    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, role, email_verified FROM users WHERE email = ?',
      [email]
    );
    let user = rows[0];

    if (!user) {
      const base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
      const username = base + crypto.randomBytes(2).toString('hex');
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const passwordHash = await hashPassword(crypto.randomBytes(24).toString('hex'));

      await db.query(
        'INSERT INTO users (username, email, password_hash, referral_code, email_verified) VALUES (?, ?, ?, ?, 1)',
        [username, email, passwordHash, referralCode]
      );

      const [newRows] = await db.query<RowDataPacket[]>(
        'SELECT id, username, email, role, email_verified FROM users WHERE email = ?',
        [email]
      );
      user = newRows[0];
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role ?? 'user',
      emailVerified: Boolean(user.email_verified),
    });

    const res = NextResponse.redirect(`${baseUrl}/dashboard`);
    setAuthCookie(res, token);
    return res;
  } catch (caughtError) {
    console.error('Google Auth Catch Error:', caughtError);
    return redirect('/login?error=InternalServerError');
  }
}
