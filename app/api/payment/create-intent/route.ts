import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    const user = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amountThb } = await req.json();
    if (!amountThb || amountThb < 20) {
      return NextResponse.json({ error: 'จำนวนเงินขั้นต่ำ ฿20' }, { status: 400 });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountThb * 100), // satang
      currency: 'thb',
      automatic_payment_methods: { enabled: true },
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
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
