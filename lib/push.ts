import webpush from 'web-push';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

const DEFAULT_VAPID_PUBLIC_KEY = 'BCMI-gMqCDZ30lhdMoBhkc1I8QLQU54FXjIJfb4F1FMPqQ7GZ5tNA1ReB6_4fXMS92QI351K3CJmSsy0wpKnbqk';
const DEFAULT_VAPID_PRIVATE_KEY = 'oQS0A7ohL7I8hEn0GiaLF-qY7BtJAsQbxMN7Y04PWck';
const DEFAULT_VAPID_EMAIL = 'admin@aura-smm.com';

export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
}

export function getVapidPrivateKey(): string {
  return process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY;
}

export function getVapidEmail(): string {
  return process.env.VAPID_EMAIL || DEFAULT_VAPID_EMAIL;
}

export function isVapidConfigured(): boolean {
  return !!(getVapidPublicKey() && getVapidPrivateKey() && getVapidEmail());
}

function buildClient() {
  webpush.setVapidDetails(
    `mailto:${getVapidEmail()}`,
    getVapidPublicKey(),
    getVapidPrivateKey(),
  );
  return webpush;
}

export async function sendAdminPush(payload: PushPayload): Promise<{ total: number; sent: number; failed: number }> {
  if (!isVapidConfigured()) {
    console.warn('[push] VAPID env vars not set — skipping');
    return { total: 0, sent: 0, failed: 0 };
  }

  let rows: RowDataPacket[];
  try {
    [rows] = await db.query<RowDataPacket[]>(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions',
    );
  } catch (err) {
    console.error('[push] DB query failed:', err);
    return { total: 0, sent: 0, failed: 0 };
  }

  if (!rows.length) return { total: 0, sent: 0, failed: 0 };

  const wp = buildClient();
  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    rows.map((sub) =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
        {
          urgency: 'high',
          TTL: 86400,
        },
      ).catch((err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          return db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
        }
        throw err;
      }),
    ),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  const sent = results.filter((r) => r.status === 'fulfilled').length;
  if (failed) console.warn(`[push] ${failed}/${rows.length} deliveries failed`);
  return { total: rows.length, sent, failed };
}
