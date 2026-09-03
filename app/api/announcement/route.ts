import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const DEFAULT_ANNOUNCEMENT = `เนื่องจากมีบริการที่ใช้งานไม่ได้ก่อนหน้านี้ทีมงานจึงได้ทำการนำบริการดังกล่าวออกและคืนเครดิตรให้กับ user เป็นที่เรียบร้อยแล้วค่ะ
ลูกค้าสามารถกดสั่งซื้อบริการได้ใหม่คะ`;

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM site_settings
       WHERE setting_key IN ('announcement_text', 'announcement_active')`,
    );
    const map = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    const text = map['announcement_text'] || DEFAULT_ANNOUNCEMENT;
    const active = map['announcement_active'] !== undefined ? map['announcement_active'] : '1';
    return NextResponse.json({
      text,
      active: active === '0' ? '0' : '1',
    });
  } catch {
    return NextResponse.json({
      text: DEFAULT_ANNOUNCEMENT,
      active: '1',
    });
  }
}
