'use client';

import { useState } from 'react';
import {
  Elements,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { BsShieldLockFill, BsCreditCard2Front, BsExclamationCircleFill } from 'react-icons/bs';
import { SiGooglepay } from 'react-icons/si';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface CheckoutProps {
  amount: number;
  netCredit: number;
  onSuccess: (intentId: string) => void;
  onError: (errMsg: string) => void;
  onSwitchToCard?: () => void;
}

function GooglePayCheckoutForm({ amount, netCredit, onSuccess, onError, onSwitchToCard }: CheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/topup/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'การชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      onError(err?.message || 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[rgba(13,24,34,0.7)] backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-3">
          <span className="flex items-center gap-2 text-white font-medium">
            <span className="p-1 rounded-md bg-white/10 text-white flex items-center justify-center">
              <SiGooglepay className="text-2xl" />
            </span>
            <span>ชำระสะดวกรวดเร็วผ่าน Google Pay</span>
          </span>
          <span className="text-emerald-400 flex items-center gap-1 font-medium">
            <BsShieldLockFill size={13} /> ปลอดภัย 100%
          </span>
        </div>

        {isAvailable === false && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2.5 text-xs">
            <p className="text-amber-200 font-semibold flex items-center gap-1.5 text-sm">
              <BsExclamationCircleFill className="text-amber-400 shrink-0" /> ไม่พบบัญชี Google Pay บนอุปกรณ์นี้
            </p>
            <p className="text-[#94A3B8] leading-relaxed">
              เบราว์เซอร์หรืออุปกรณ์ของคุณยังไม่ได้ผูกบัตรกับ Google Pay คุณสามารถคลิกปุ่มด้านล่างเพื่อสลับไปชำระผ่าน <strong>&ldquo;บัตรเครดิต / เดบิต&rdquo;</strong> ได้ทันที
            </p>
            {onSwitchToCard && (
              <button
                type="button"
                onClick={onSwitchToCard}
                className="mt-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                <BsCreditCard2Front size={15} /> สลับไปชำระผ่านบัตรเครดิต / เดบิต
              </button>
            )}
          </div>
        )}

        <div className={isAvailable === false ? 'hidden' : 'block'}>
          <ExpressCheckoutElement
            onReady={({ availablePaymentMethods }) => {
              const hasWallet = Boolean(
                availablePaymentMethods &&
                (availablePaymentMethods.googlePay || availablePaymentMethods.applePay)
              );
              setIsAvailable(hasWallet);
            }}
            onConfirm={handleConfirm}
            options={{
              buttonType: {
                googlePay: 'pay',
                applePay: 'buy',
              },
              paymentMethods: {
                googlePay: 'always',
                applePay: 'always',
                link: 'never',
              },
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1 pt-1">
          <span className="text-xs text-[#94A3B8]">
            ยอดชำระ ฿{amount.toLocaleString()} (สุทธิ {netCredit.toLocaleString()} เครดิต)
          </span>
          <span className="text-[11px] text-rose-300 font-mono">
            หักค่าธรรมเนียม -8 เครดิต
          </span>
        </div>

        {submitting && (
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 py-2">
            <span className="animate-spin w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full" />
            กำลังประมวลผลการชำระเงิน...
          </div>
        )}
      </div>
    </div>
  );
}

interface StripeGooglePayEmbeddedProps {
  clientSecret: string;
  amount: number;
  netCredit: number;
  onSuccess: (intentId: string) => void;
  onError: (errMsg: string) => void;
  onSwitchToCard?: () => void;
}

export default function StripeGooglePayEmbedded({
  clientSecret,
  amount,
  netCredit,
  onSuccess,
  onError,
  onSwitchToCard,
}: StripeGooglePayEmbeddedProps) {
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
        colorPrimary: '#10b981',
        colorBackground: '#0d1822',
        colorText: '#f1f5f9',
        colorDanger: '#f87171',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '12px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <GooglePayCheckoutForm
        amount={amount}
        netCredit={netCredit}
        onSuccess={onSuccess}
        onError={onError}
        onSwitchToCard={onSwitchToCard}
      />
    </Elements>
  );
}
