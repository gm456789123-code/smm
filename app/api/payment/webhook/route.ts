import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get('stripe-signature');

  if (!sig) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    console.error('Webhook signature failed:', e);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const userId   = intent.metadata?.userId;
    const amountThb = Number(intent.metadata?.amountThb ?? 0);

    if (!userId || !amountThb) {
      return new Response('Missing metadata', { status: 400 });
    }

    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM transactions WHERE ref = ? LIMIT 1',
      [intent.id]
    );
    if ((existing as RowDataPacket[]).length > 0) {
      return Response.json({ received: true, duplicate: true });
    }

    await db.query(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amountThb, Number(userId)]
    );
    await db.query(
      `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
       VALUES (?, 'topup', ?, ?, 'completed', ?)`,
      [Number(userId), amountThb, intent.id, `Stripe top-up THB ${amountThb}`]
    );

    console.log(`Top-up completed: user ${userId} +THB ${amountThb} (${intent.id})`);
  }

  return Response.json({ received: true });
}
