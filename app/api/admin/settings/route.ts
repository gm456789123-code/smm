import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [rows] = await db.query<RowDataPacket[]>('SELECT setting_key, setting_value FROM site_settings');
  const data = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
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
