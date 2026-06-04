import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { verifyToken } from '@/lib/jwt';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRl = checkRateLimit(`payment-intent-ip:${ip}`, 30, 10 * 60 * 1000);
    if (!ipRl.ok) {
      return NextResponse.json({ error: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
    }

    const token = req.cookies.get('auth_token')?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRl = checkRateLimit(`payment-intent-user:${user.userId}`, 15, 10 * 60 * 1000);
    if (!userRl.ok) {
      return NextResponse.json({ error: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });
    }

    const { amountThb, paymentMethod } = await req.json();
    if (!amountThb || typeof amountThb !== 'number' || amountThb < 20 || amountThb > 50000) {
      return NextResponse.json({ error: 'จำนวนเงิน ฿20 – ฿50,000 เท่านั้น' }, { status: 400 });
    }

    // Map channel key → Stripe payment_method_types
    const METHOD_MAP: Record<string, string[]> = {
      promptpay: ['promptpay'],
      truemoney: ['truemoney'],
      card:      ['card'],
      link:      ['link', 'card'],
    };
    const methodTypes = METHOD_MAP[paymentMethod as string];

    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(amountThb * 100),
      currency: 'thb',
      ...(methodTypes
        ? { payment_method_types: methodTypes as any }
        : { automatic_payment_methods: { enabled: true } }),
      metadata: {
        userId:    String(user.userId),
        username:  user.username,
        amountThb: String(amountThb),
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      intentId: intent.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
