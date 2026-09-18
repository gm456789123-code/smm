import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import stripe from '@/lib/stripe';
import { creditTopupAtomic } from '@/lib/credit-topup';
import { sendAdminPush } from '@/lib/push';

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const intentId = req.nextUrl.searchParams.get('id');
  if (!intentId) return NextResponse.json({ error: 'Missing intentId' }, { status: 400 });

  try {
    const intent = await stripe.paymentIntents.retrieve(intentId);

    if (intent.status === 'succeeded') {
      const amountThb = Number(intent.metadata?.amountThb ?? (intent.amount ? intent.amount / 100 : 0));
      const creditAmount = intent.metadata?.netCredit ? Number(intent.metadata.netCredit) : amountThb;

      const isCard = intent.metadata?.paymentMethod === 'card';

      if (creditAmount > 0) {
        const result = await creditTopupAtomic({
          userId: user.userId,
          amount: creditAmount,
          ref: intent.id,
          note: isCard
            ? `Stripe Card THB ${amountThb} (หักค่าธรรมเนียม -8 เครดิต = +${creditAmount})`
            : `Stripe PromptPay THB ${amountThb}`,
          provider: 'stripe',
          referral: true,
          bonus: true,
        });

        if (result.status === 'credited') {
          sendAdminPush({
            title: isCard ? '💳 เงินเข้าใหม่ (Stripe บัตรเครดิต)' : '💳 เงินเข้าใหม่ (Stripe PromptPay)',
            body: `ผู้ใช้ ID #${user.userId} เติมเงิน ฿${amountThb.toLocaleString('th-TH')}${isCard ? ` (สุทธิ ${creditAmount} เครดิต)` : ''}`,
            url: '/admin/topups',
            tag: `topup-stripe-${intent.id}`,
          }).catch(() => {});
        }
      }

      return NextResponse.json({ status: 'succeeded', amount: creditAmount, ref: intent.id });
    }

    return NextResponse.json({ status: intent.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
