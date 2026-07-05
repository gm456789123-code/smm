import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { signToken } from '@/lib/jwt';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  const BASE = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '');
  const redirect = (path: string) => NextResponse.redirect(`${BASE}${path}`);

  if (error || !code) {
    return redirect('/login?error=GoogleAuthFailed');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${BASE}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: 'Google OAuth credentials missing (Client Secret is required)' }, { status: 500 });
  }

  try {
    // 1. Exchange code for access token and id_token
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

    // 2. Fetch user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    if (!userData.email) {
      return redirect('/login?error=NoEmailProvided');
    }

    const email = userData.email;
    const name = userData.name || email.split('@')[0];

    // 3. Find or Create User in DB
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, role, email_verified FROM users WHERE email = ?',
      [email]
    );
    let user = rows[0];

    if (!user) {
      const base          = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
      const username      = base + crypto.randomBytes(2).toString('hex');
      const referralCode  = crypto.randomBytes(4).toString('hex').toUpperCase();
      const passwordHash  = await hashPassword(crypto.randomBytes(24).toString('hex'));

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

    // 4. Generate JWT Token
    const token = await signToken({
      userId:        user.id,
      username:      user.username,
      email:         user.email,
      role:          user.role ?? 'user',
      emailVerified: Boolean(user.email_verified),
    });

    // 5. Set Cookie and Redirect to Dashboard
    const res = NextResponse.redirect(`${BASE}/dashboard`);
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 7,
      path:     '/',
    });

    return res;

  } catch (error) {
    console.error('Google Auth Catch Error:', error);
    return redirect('/login?error=InternalServerError');
  }
}
