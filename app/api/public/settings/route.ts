import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const PUBLIC_KEYS = new Set(['logo_url', 'brand_name', 'brand_tagline', 'line_url']);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT setting_key, setting_value FROM site_settings'
    );
    const data: Record<string, string> = {};
    for (const r of rows) {
      if (PUBLIC_KEYS.has(r.setting_key)) data[r.setting_key] = r.setting_value ?? '';
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}
