import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import LineFloatButton from './LineFloatButton';

export default async function LineFloatButtonServer() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'line_url' LIMIT 1"
    );
    const url: string = rows[0]?.setting_value ?? '';
    return <LineFloatButton url={url} />;
  } catch {
    return null;
  }
}
