import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { getVapidPublicKey } from '@/lib/push';

async function adminOnly(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  if (!await adminOnly(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const vapidPublicKey = getVapidPublicKey();
  const endpoint = req.nextUrl.searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ subscribed: false, vapidPublicKey });

  const [rows] = await db.query<any[]>(
    'SELECT id FROM push_subscriptions WHERE endpoint = ? LIMIT 1',
    [endpoint],
  );
  return NextResponse.json({ subscribed: rows.length > 0, vapidPublicKey });
}

export async function POST(req: NextRequest) {
  if (!await adminOnly(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await db.query(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), updated_at = NOW()`,
    [endpoint, keys.p256dh, keys.auth],
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await adminOnly(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });

  await db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
  return NextResponse.json({ ok: true });
}
