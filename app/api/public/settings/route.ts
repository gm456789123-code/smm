import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const PUBLIC_KEYS = new Set([
  'logo_url', 'brand_name', 'brand_tagline',
  'line_url', 'line_active',
  'facebook_url', 'facebook_active',
  'telegram_url', 'telegram_active',
  'discord_url',  'discord_active',
  'promptpay_number', 'bank_name', 'bank_account_name', 'bank_account_number', 'truewallet_id',
]);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT setting_key, setting_value FROM site_settings'
    );
    const data: Record<string, string> = {
      bank_name: process.env.NEXT_PUBLIC_BANK_NAME ?? 'ธนาคาร',
      bank_account_name: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? 'ชื่อบัญชี',
      bank_account_number: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? '',
      promptpay_number: process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER ?? '',
      truewallet_id: process.env.NEXT_PUBLIC_TRUEWALLET_ID ?? '',
    };
    for (const r of rows) {
      if (PUBLIC_KEYS.has(r.setting_key)) {
        if (r.setting_value != null && r.setting_value !== '') {
          data[r.setting_key] = r.setting_value;
        }
      }
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}
