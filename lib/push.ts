import webpush from 'web-push';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@example.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendAdminPush(payload: PushPayload) {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions'
    );
    if (!rows.length) return;

    await Promise.allSettled(
      rows.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          )
          .catch((err: { statusCode?: number }) => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
            }
          })
      )
    );
  } catch (err) {
    console.error('[push] sendAdminPush:', err);
  }
}
