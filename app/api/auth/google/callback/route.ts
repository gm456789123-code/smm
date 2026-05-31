import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { signToken } from '@/lib/jwt';
import crypto from 'crypto';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=GoogleAuthFailed', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

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
      return NextResponse.redirect(new URL('/login?error=GoogleTokenError', request.url));
    }

    // 2. Fetch user profile
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    if (!userData.email) {
      return NextResponse.redirect(new URL('/login?error=NoEmailProvided', request.url));
    }

    const email = userData.email;
    const name = userData.name || email.split('@')[0];

    // 3. Find or Create User in DB
    const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    let user = rows[0];

    if (!user) {
      // Create new user
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000);
      const referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
      const randomPassword = crypto.randomBytes(16).toString('hex'); // Users can't login via password unless they reset it
      
      const [insertResult] = await db.query(
        'INSERT INTO users (username, email, password_hash, referral_code, email_verified) VALUES (?, ?, ?, ?, 1)',
        [username, email, randomPassword, referralCode]
      );
      
      const [newRows] = await db.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
      user = newRows[0];
    }

    // 4. Generate JWT Token
    const token = await signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // 5. Set Cookie and Redirect to Dashboard
    const res = NextResponse.redirect(new URL('/dashboard', request.url));
    res.cookies.set('auth_token', token, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return res;

  } catch (error) {
    console.error('Google Auth Catch Error:', error);
    return NextResponse.redirect(new URL('/login?error=InternalServerError', request.url));
  }
}
