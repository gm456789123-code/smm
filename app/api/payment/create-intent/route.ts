import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRl = checkRateLimit(`payment-intent-ip:${ip}`, 30, 10 * 60 * 1000);
    if (!ipRl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRl = checkRateLimit(`payment-intent-user:${user.userId}`, 15, 10 * 60 * 1000);
    if (!userRl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { amountThb, paymentMethod } = await req.json();
    if (!amountThb || typeof amountThb !== 'number' || amountThb < 20 || amountThb > 50000) {
      return NextResponse.json({ error: 'Amount must be between THB 20 and THB 50,000.' }, { status: 400 });
    }

    const METHOD_MAP: Record<string, Stripe.PaymentIntentCreateParams.PaymentMethodType[]> = {
      promptpay: ['promptpay'],
      truemoney: ['truemoney'],
      card: ['card'],
      link: ['link', 'card'],
    };
    const methodTypes = METHOD_MAP[paymentMethod as string];

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountThb * 100),
      currency: 'thb',
      ...(methodTypes
        ? { payment_method_types: methodTypes }
        : { automatic_payment_methods: { enabled: true } }),
      metadata: {
        userId: String(user.userId),
        username: user.username,
        amountThb: String(amountThb),
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      intentId: intent.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
