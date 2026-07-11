import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM site_settings
       WHERE setting_key IN ('announcement_text', 'announcement_active')`,
    );
    const map = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    return NextResponse.json({
      text:   map['announcement_text']   ?? '',
      active: map['announcement_active'] ?? '0',
    });
  } catch {
    return NextResponse.json({ text: '', active: '0' });
  }
}
