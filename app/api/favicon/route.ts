export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { SITE_URL } from '@/lib/site';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'favicon_url' LIMIT 1"
    );
    const val: string = rows[0]?.setting_value ?? '';
    if (val) {
      const target = val.startsWith('/') ? `${SITE_URL}${val}` : val;
      return NextResponse.redirect(target, { status: 302 });
    }
  } catch {}
  return NextResponse.redirect(`${SITE_URL}/icon.png`, { status: 302 });
}
