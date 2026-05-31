'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function SuccessContent() {
  const params = useSearchParams();
  const clientSecret = params.get('payment_intent_client_secret');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(
    clientSecret ? 'loading' : 'failed'
  );

  useEffect(() => {
    if (!clientSecret) return;

    stripePromise.then((stripe) => {
      if (!stripe) return;
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        setStatus(paymentIntent?.status === 'succeeded' ? 'success' : 'failed');
      });
    });
  }, [clientSecret]);

  if (status === 'loading') {
    return <p className="text-[#94A3B8] text-sm animate-pulse">กำลังตรวจสอบ...</p>;
  }

  return status === 'success' ? (
    <div className="text-center space-y-4">
      <div className="text-5xl">✅</div>
      <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">ชำระเงินสำเร็จ!</h2>
      <p className="text-[#94A3B8] text-sm">Balance จะอัปเดตอัตโนมัติภายในไม่กี่วินาที</p>
      <Link href="/" className="glass-tab glass-tab-active block px-6 py-2.5 text-sm font-semibold text-[#c4b5fd]">
        กลับ Dashboard
      </Link>
    </div>
  ) : (
    <div className="text-center space-y-4">
      <div className="text-5xl">❌</div>
      <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">การชำระเงินไม่สำเร็จ</h2>
      <Link href="/topup" className="glass-tab block px-6 py-2.5 text-sm text-[#94A3B8]">
        ลองใหม่
      </Link>
    </div>
  );
}

export default function TopupSuccessPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="glass p-8 max-w-sm w-full">
        <Suspense fallback={<p className="text-[#94A3B8] text-sm text-center">กำลังโหลด...</p>}>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  );
}
