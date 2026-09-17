import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRl = checkRateLimit(`stripe-checkout-ip:${ip}`, 30, 10 * 60 * 1000);
    if (!ipRl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRl = checkRateLimit(`stripe-checkout-user:${user.userId}`, 15, 10 * 60 * 1000);
    if (!userRl.ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { amountThb } = await req.json();
    if (!amountThb || typeof amountThb !== 'number' || amountThb < 20 || amountThb > 50000) {
      return NextResponse.json({ error: 'ยอดเงินต้องอยู่ระหว่าง ฿20 ถึง ฿50,000' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'promptpay'],
      line_items: [
        {
          price_data: {
            currency: 'thb',
            product_data: {
              name: `เติมเงินเครดิต SMM (฿${amountThb.toLocaleString()})`,
              description: `User: ${user.username} (ID #${user.userId})`,
            },
            unit_amount: Math.round(amountThb * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: String(user.userId),
      metadata: {
        userId: String(user.userId),
        username: user.username,
        amountThb: String(amountThb),
      },
      success_url: `${origin}/topup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/topup`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[stripe-create-checkout-session]', error);
    return NextResponse.json({ error: error?.message || 'ไม่สามารถสร้างรายการชำระเงินได้' }, { status: 500 });
  }
}
