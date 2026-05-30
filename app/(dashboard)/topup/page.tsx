'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const AMOUNTS = [100, 300, 500, 1000, 2000, 5000];

const CHANNELS = [
  { label: 'PromptPay',     icon: '🟦', desc: 'พร้อมเพย์ทุกธนาคาร' },
  { label: 'TrueMoney',     icon: '🟠', desc: 'ทรูมันนี่ วอลเล็ท' },
  { label: 'บัตรเครดิต',    icon: '💳', desc: 'Visa, Mastercard, JCB, Amex' },
  { label: 'Apple Pay',     icon: '🍎', desc: 'iOS / macOS Safari' },
  { label: 'Google Pay',    icon: '🔵', desc: 'Android / Chrome' },
  { label: 'Link',          icon: '🔗', desc: 'Stripe Link Wallet' },
];

const appearance = {
  theme: 'night' as const,
  variables: {
    colorPrimary: '#8B5CF6',
    colorBackground: '#0D1221',
    colorText: '#F1F5F9',
    colorDanger: '#ef4444',
    colorTextPlaceholder: '#475569',
    borderRadius: '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  rules: {
    '.Input': { border: '1px solid rgba(139,92,246,0.18)', backgroundColor: 'rgba(13,18,33,0.8)' },
    '.Input:focus': { border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 0 0 3px rgba(139,92,246,0.12)' },
    '.Tab': { border: '1px solid rgba(139,92,246,0.12)', backgroundColor: 'rgba(139,92,246,0.06)' },
    '.Tab:hover': { border: '1px solid rgba(139,92,246,0.3)' },
    '.Tab--selected': { border: '1px solid rgba(139,92,246,0.5)', backgroundColor: 'rgba(139,92,246,0.18)' },
    '.Label': { color: '#94A3B8' },
  },
};

function CheckoutForm({ amountThb }: { amountThb: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/topup/success`,
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'การชำระเงินล้มเหลว');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#475569] uppercase tracking-wider">เลือกวิธีชำระเงิน</p>
        <p className="text-[#06B6D4] font-bold font-mono text-sm">฿{amountThb.toLocaleString()}</p>
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'กำลังดำเนินการ...' : `ชำระเงิน ฿${amountThb.toLocaleString()}`}
      </button>
    </form>
  );
}

export default function TopupPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createIntent(amt: number) {
    setSelected(amt);
    setClientSecret('');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountThb: amt }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setClientSecret(data.clientSecret);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">เติมเงิน</h1>
        <p className="text-[#475569] text-sm mt-0.5">เลือกจำนวนแล้วชำระผ่านช่องทางที่ต้องการ</p>
      </div>

      {/* Supported channels */}
      <div className="glass p-5 space-y-3">
        <p className="text-xs text-[#475569] uppercase tracking-wider">ช่องทางที่รองรับ</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CHANNELS.map((ch) => (
            <div key={ch.label} className="glass-tab px-3 py-2.5 flex items-center gap-2.5">
              <span className="text-xl leading-none">{ch.icon}</span>
              <div>
                <p className="text-xs font-semibold text-[#F1F5F9]">{ch.label}</p>
                <p className="text-[10px] text-[#475569] leading-tight">{ch.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amount selection */}
      <div className="glass p-5 space-y-3">
        <p className="text-xs text-[#475569] uppercase tracking-wider">เลือกจำนวนเงิน</p>
        <div className="grid grid-cols-3 gap-2">
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => createIntent(amt)}
              disabled={loading && selected === amt}
              className={[
                'glass-tab py-3 text-sm font-semibold transition-all',
                selected === amt && clientSecret
                  ? 'glass-tab-active text-[#c4b5fd]'
                  : selected === amt && loading
                  ? 'glass-tab-active text-[#c4b5fd] opacity-70'
                  : 'text-[#94A3B8]',
              ].join(' ')}
            >
              {loading && selected === amt ? (
                <span className="animate-pulse">โหลด...</span>
              ) : (
                `฿${amt.toLocaleString()}`
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Stripe Payment Element */}
      {clientSecret && selected && (
        <div className="glass p-5">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance }}
          >
            <CheckoutForm amountThb={selected} />
          </Elements>
        </div>
      )}
    </main>
  );
}
