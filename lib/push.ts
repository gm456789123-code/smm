import webpush from 'web-push';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function isVapidConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_EMAIL
  );
}

function buildClient() {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return webpush;
}

export async function sendAdminPush(payload: PushPayload): Promise<void> {
  if (!isVapidConfigured()) {
    console.warn('[push] VAPID env vars not set — skipping');
    return;
  }

  let rows: RowDataPacket[];
  try {
    [rows] = await db.query<RowDataPacket[]>(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions',
    );
  } catch (err) {
    console.error('[push] DB query failed:', err);
    return;
  }

  if (!rows.length) return;

  const wp = buildClient();
  const body = JSON.stringify(payload);

  const results = await Promise.allSettled(
    rows.map((sub) =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body,
      ).catch((err: { statusCode?: number }) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          return db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
        }
        throw err;
      }),
    ),
  );

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed) console.warn(`[push] ${failed}/${rows.length} deliveries failed`);
}
