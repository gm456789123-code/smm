'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Suspense } from 'react';
import { BsCheckCircleFill, BsXCircleFill, BsArrowRight } from 'react-icons/bs';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function SuccessContent() {
  const params = useSearchParams();
  const clientSecret = params.get('payment_intent_client_secret');
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(
    clientSecret || sessionId ? 'loading' : 'failed'
  );

  useEffect(() => {
    if (sessionId) {
      setStatus('success');
      window.dispatchEvent(new Event('smm-data-changed'));
      return;
    }

    if (!clientSecret || !stripePromise) {
      if (!clientSecret) setStatus('failed');
      return;
    }

    stripePromise.then((stripe) => {
      if (!stripe) {
        setStatus('success');
        return;
      }
      stripe.retrievePaymentIntent(clientSecret).then(async ({ paymentIntent }) => {
        if (paymentIntent?.status === 'succeeded') {
          try {
            await fetch(`/api/payment/check-intent?id=${paymentIntent.id}`);
          } catch {}
          setStatus('success');
          window.dispatchEvent(new Event('smm-data-changed'));
        } else {
          setStatus('failed');
        }
      }).catch(() => {
        setStatus('failed');
      });
    });
  }, [clientSecret, sessionId]);

  if (status === 'loading') {
    return (
      <div className="text-center space-y-3 py-6">
        <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full mx-auto" />
        <p className="text-[#94A3B8] text-sm">กำลังตรวจสอบสถานะการชำระเงิน...</p>
      </div>
    );
  }

  return status === 'success' ? (
    <div className="text-center space-y-4 py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
          <BsCheckCircleFill size={36} className="text-emerald-400" />
        </div>
      </div>
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">ชำระเงินสำเร็จ!</h2>
        <p className="text-[#94A3B8] text-sm">ยอดเงินกำลังถูกเพิ่มเข้าสู่บัญชีของคุณอัตโนมัติ</p>
      </div>
      <div className="pt-2 flex gap-3">
        <Link
          href="/dashboard"
          className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white flex items-center justify-center gap-1.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
        >
          กลับหน้าหลัก <BsArrowRight size={13} />
        </Link>
      </div>
    </div>
  ) : (
    <div className="text-center space-y-4 py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/15 border border-red-500/30">
          <BsXCircleFill size={36} className="text-red-400" />
        </div>
      </div>
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">การชำระเงินไม่สำเร็จ</h2>
        <p className="text-[#94A3B8] text-sm">ยังไม่พบข้อมูลการชำระเงิน หรือการทำรายการถูกยกเลิก</p>
      </div>
      <div className="pt-2">
        <Link
          href="/topup"
          className="block w-full py-2.5 text-sm font-semibold rounded-xl border border-[rgba(139,92,246,0.3)] text-[#94A3B8] hover:text-white hover:border-[rgba(139,92,246,0.6)] transition-all text-center"
        >
          ลองใหม่อีกครั้ง
        </Link>
      </div>
    </div>
  );
}

export default function TopupSuccessPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="glass p-6 max-w-sm w-full rounded-2xl border border-[rgba(139,92,246,0.3)]" style={{ boxShadow: '0 0 50px rgba(139,92,246,0.2)' }}>
        <Suspense fallback={<p className="text-[#94A3B8] text-sm text-center">กำลังโหลด...</p>}>
          <SuccessContent />
        </Suspense>
      </div>
    </main>
  );
}
