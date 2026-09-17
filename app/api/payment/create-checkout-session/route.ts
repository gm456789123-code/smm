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

    const { amountThb, paymentMethod } = await req.json();
    const isCard = paymentMethod === 'card';
    const minAmount = isCard ? 150 : 10;

    if (!amountThb || typeof amountThb !== 'number' || amountThb < minAmount || amountThb > 50000) {
      return NextResponse.json({
        error: isCard
          ? 'ยอดชำระผ่านบัตรเครดิตต้องไม่ต่ำกว่า ฿150 (หักค่าธรรมเนียม -5 เครดิตทุกกรณี)'
          : 'ยอดชำระผ่านพร้อมเพย์ต้องไม่ต่ำกว่า ฿10',
      }, { status: 400 });
    }

    const netCredit = isCard ? Math.max(0, amountThb - 5) : amountThb;
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    let methodTypes: ('card' | 'promptpay')[] = ['promptpay', 'card'];
    if (paymentMethod === 'promptpay') {
      methodTypes = ['promptpay'];
    } else if (paymentMethod === 'card') {
      methodTypes = ['card'];
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: methodTypes,
        line_items: [
          {
            price_data: {
              currency: 'thb',
              product_data: {
                name: `เติมเงินเครดิต SMM (฿${amountThb.toLocaleString()})`,
                description: isCard
                  ? `User: ${user.username} (ID #${user.userId}) [หักค่าธรรมเนียม -5 เครดิต ได้รับสุทธิ ${netCredit} เครดิต]`
                  : `User: ${user.username} (ID #${user.userId})`,
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
          netCredit: String(netCredit),
          paymentMethod: isCard ? 'card' : 'promptpay',
        },
        success_url: `${origin}/topup/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/topup`,
      });

      return NextResponse.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (createErr: any) {
      if (createErr?.message?.includes('promptpay is invalid')) {
        return NextResponse.json({
          error: 'ยังไม่ได้เปิดใช้งาน PromptPay บน Stripe Dashboard กรุณาเข้าไปที่ Stripe > Settings > Payment methods แล้วกด Turn on ที่หัวข้อ PromptPay (ทำแค่ครั้งเดียว) หรือเลือกชำระผ่านบัตรเครดิต/เดบิต แทนได้ครับ',
        }, { status: 400 });
      }
      throw createErr;
    }
  } catch (error: any) {
    console.error('[stripe-create-checkout-session]', error);
    return NextResponse.json({ error: error?.message || 'ไม่สามารถสร้างรายการชำระเงินได้' }, { status: 500 });
  }
}
