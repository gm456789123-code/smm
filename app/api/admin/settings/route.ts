import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-settings:get:${ip}`, 120, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [rows] = await db.query<RowDataPacket[]>('SELECT setting_key, setting_value FROM site_settings');
  const data = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-settings:put:${ip}`, 40, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body: Record<string, string> = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await db.query(
      'INSERT INTO site_settings (setting_key, setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=?',
      [key, value, value]
    );
  }
  return NextResponse.json({ ok: true });
}
