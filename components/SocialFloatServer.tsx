import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import SocialFloat from './SocialFloat';

const PLATFORMS = ['line', 'facebook', 'telegram', 'discord'] as const;

export default async function SocialFloatServer() {
  try {
    const keys = PLATFORMS.flatMap(p => [`${p}_url`, `${p}_active`]);
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (${keys.map(() => '?').join(',')})`,
      keys
    );
    const map = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value ?? '']));

    const links = PLATFORMS.map(p => ({
      platform: p,
      url: map[`${p}_url`] ?? '',
      active: map[`${p}_active`] === '1',
    }));

    return <SocialFloat links={links} />;
  } catch {
    return null;
  }
}
