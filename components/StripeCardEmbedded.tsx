'use client';

import { useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { BsShieldLockFill, BsCreditCard2Front, BsArrowRight } from 'react-icons/bs';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface CheckoutFormProps {
  amount: number;
  netCredit: number;
  onSuccess: (intentId: string) => void;
  onError: (errMsg: string) => void;
}

function CheckoutForm({ amount, netCredit, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/topup`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'การชำระเงินไม่สำเร็จ กรุณาตรวจสอบข้อมูลบัตร');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'processing') {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      onError(err?.message || 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(13,18,34,0.7)] backdrop-blur-md">
        <PaymentElement
          onReady={() => setElementReady(true)}
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <BsShieldLockFill size={13} /> ชำระปลอดภัย 100% เข้ารหัสระดับธนาคาร (Stripe)
        </span>
        <span className="text-[11px] text-rose-300 font-mono">
          หักค่าธรรมเนียม -8 เครดิต
        </span>
      </div>

      <button
        type="submit"
        disabled={!stripe || !elementReady || submitting}
        className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg cursor-pointer"
        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
      >
        {submitting ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            กำลังประมวลผลการชำระเงิน...
          </>
        ) : (
          <>
            <BsCreditCard2Front size={16} />
            ยืนยันชำระ ฿{amount.toLocaleString()} (ได้รับสุทธิ {netCredit.toLocaleString()} เครดิต)
            <BsArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}

interface StripeCardEmbeddedProps {
  clientSecret: string;
  amount: number;
  netCredit: number;
  onSuccess: (intentId: string) => void;
  onError: (errMsg: string) => void;
}

export default function StripeCardEmbedded({
  clientSecret,
  amount,
  netCredit,
  onSuccess,
  onError,
}: StripeCardEmbeddedProps) {
  if (!stripePromise || !clientSecret) {
    return (
      <div className="py-6 text-center text-xs text-rose-400">
        ไม่พบการตั้งค่า Stripe หรือรหัสชำระเงินไม่ถูกต้อง
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#0d1222',
        colorText: '#f1f5f9',
        colorDanger: '#f87171',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '12px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        amount={amount}
        netCredit={netCredit}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
