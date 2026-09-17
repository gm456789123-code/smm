import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { creditTopupAtomic } from '@/lib/credit-topup';
import { sendAdminPush } from '@/lib/push';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe signature header', { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured in environment variables');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (e: any) {
    console.error('Webhook signature verification failed:', e.message);
    return new Response(`Invalid signature: ${e.message}`, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const userId = intent.metadata?.userId;
      const amountThb = Number(intent.metadata?.amountThb ?? (intent.amount ? intent.amount / 100 : 0));

      if (!userId || !amountThb) {
        console.warn('payment_intent.succeeded missing userId or amountThb metadata:', intent.id);
        return Response.json({ received: true, warning: 'missing metadata' });
      }

      const result = await creditTopupAtomic({
        userId: Number(userId),
        amount: amountThb,
        ref: intent.id,
        note: `Stripe PaymentIntent THB ${amountThb}`,
        provider: 'stripe',
        referral: true,
        bonus: true,
      });

      if (result.status === 'error') {
        console.error('Stripe top-up credit failed:', result.message, intent.id);
        return new Response('Credit failed', { status: 500 });
      }

      if (result.status === 'duplicate') {
        return Response.json({ received: true, duplicate: true });
      }

      sendAdminPush({
        title: '💳 เงินเข้าใหม่ (Stripe)',
        body: `ผู้ใช้ ID #${userId} เติมเงิน ฿${amountThb.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
        url: '/admin/topups',
        tag: `topup-stripe-${intent.id}`,
      }).catch(() => {});

      console.log(`Top-up completed: user ${userId} +THB ${amountThb} (${intent.id})`);
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const amountThb = Number(
        session.metadata?.amountThb ?? (session.amount_total ? session.amount_total / 100 : 0)
      );

      const creditAmount = session.metadata?.netCredit
        ? Number(session.metadata.netCredit)
        : amountThb;

      if (userId && creditAmount > 0) {
        const isCard = session.metadata?.paymentMethod === 'card';
        const result = await creditTopupAtomic({
          userId: Number(userId),
          amount: creditAmount,
          ref: session.id,
          note: isCard
            ? `Stripe Card THB ${amountThb} (หักค่าธรรมเนียม -5 เครดิต = +${creditAmount})`
            : `Stripe PromptPay THB ${amountThb}`,
          provider: 'stripe',
          referral: true,
          bonus: true,
        });

        if (result.status === 'credited') {
          sendAdminPush({
            title: '💳 เงินเข้าใหม่ (Stripe Checkout)',
            body: `ผู้ใช้ ID #${userId} เติมเงิน ฿${amountThb.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
            url: '/admin/topups',
            tag: `topup-stripe-${session.id}`,
          }).catch(() => {});
        }
      }
    }

    return Response.json({ received: true });
  } catch (err: any) {
    console.error('Error processing Stripe webhook event:', err);
    return new Response('Webhook processing error', { status: 500 });
  }
}
