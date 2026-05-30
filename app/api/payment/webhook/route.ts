import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import db from '@/lib/db';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    console.error('Webhook signature failed:', e);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    const userId = intent.metadata?.userId;
    const amountThb = Number(intent.metadata?.amountThb ?? 0);

    if (!userId || !amountThb) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // เพิ่ม balance อัตโนมัติ
    await db.query(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amountThb, Number(userId)]
    );

    // บันทึก transaction
    await db.query(
      `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
       VALUES (?, 'topup', ?, ?, 'completed', ?)`,
      [Number(userId), amountThb, intent.id, `Stripe top-up ฿${amountThb}`]
    );

    console.log(`✅ Top-up: user ${userId} +฿${amountThb} (${intent.id})`);
  }

  return NextResponse.json({ received: true });
}
