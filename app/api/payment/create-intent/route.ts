import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

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
    const isCard = paymentMethod === 'card';
    const minAmount = isCard ? 150 : 10;

    if (!amountThb || typeof amountThb !== 'number' || amountThb < minAmount || amountThb > 50000) {
      return NextResponse.json({
        error: isCard
          ? 'ยอดชำระผ่านบัตรเครดิตต้องไม่ต่ำกว่า ฿150 (หักค่าธรรมเนียม -7 เครดิตทุกกรณี)'
          : 'ยอดชำระผ่านพร้อมเพย์ต้องไม่ต่ำกว่า ฿10',
      }, { status: 400 });
    }

    const netCredit = isCard ? Math.max(0, amountThb - 7) : amountThb;

    if (paymentMethod === 'promptpay') {
      // สร้าง Stripe PromptPay intent และ confirm ทันทีเพื่อให้ได้ QR image
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amountThb * 100),
        currency: 'thb',
        payment_method_types: ['promptpay'],
        payment_method_data: {
          type: 'promptpay',
          billing_details: {
            name: user.username || `User ${user.userId}`,
            email: user.email && user.email.includes('@') ? user.email : `user${user.userId}@aura-smm.com`,
          },
        },
        confirm: true,
        metadata: {
          userId: String(user.userId),
          username: user.username,
          amountThb: String(amountThb),
          netCredit: String(netCredit),
          paymentMethod: 'promptpay',
        },
      });

      const qrAction = intent.next_action?.promptpay_display_qr_code;
      const qrDataUrl = qrAction?.image_url_png || qrAction?.image_url_svg || (qrAction as any)?.data_url;

      return NextResponse.json({
        intentId: intent.id,
        clientSecret: intent.client_secret,
        qrDataUrl,
        hostedUrl: qrAction?.hosted_instructions_url,
        amount: amountThb,
      });
    }

    // กรณีอื่นๆ เช่น Card
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amountThb * 100),
      currency: 'thb',
      payment_method_types: ['card'],
      metadata: {
        userId: String(user.userId),
        username: user.username,
        amountThb: String(amountThb),
        netCredit: String(netCredit),
        paymentMethod: 'card',
      },
    });

    return NextResponse.json({
      intentId: intent.id,
      clientSecret: intent.client_secret,
    });
  } catch (error: any) {
    console.error('[create-payment-intent-error]', error);
    return NextResponse.json({ error: error?.message || 'Something went wrong.' }, { status: 500 });
  }
}
