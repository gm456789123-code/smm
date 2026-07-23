import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { creditTopupAtomic } from '@/lib/credit-topup';

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
    const userId = intent.metadata?.userId;
    const amountThb = Number(intent.metadata?.amountThb ?? 0);

    if (!userId || !amountThb) {
      return new Response('Missing metadata', { status: 400 });
    }

    // Stripe may retry webhooks — UNIQUE(ref) + atomic credit makes this idempotent
    const result = await creditTopupAtomic({
      userId: Number(userId),
      amount: amountThb,
      ref: intent.id,
      note: `Stripe top-up THB ${amountThb}`,
      provider: 'stripe',
    });

    if (result.status === 'error') {
      console.error('Stripe top-up credit failed:', result.message, intent.id);
      return new Response('Credit failed', { status: 500 });
    }

    if (result.status === 'duplicate') {
      return Response.json({ received: true, duplicate: true });
    }

    console.log(`Top-up completed: user ${userId} +THB ${amountThb} (${intent.id})`);
  }

  return Response.json({ received: true });
}
