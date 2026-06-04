'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  BsQrCodeScan, BsWallet2, BsCreditCard2FrontFill,
  BsApple, BsPhone, BsLink45Deg, BsCheckCircleFill,
} from 'react-icons/bs';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const AMOUNTS = [100, 300, 500, 1000, 2000, 5000];

const CHANNELS = [
  {
    key:    'promptpay',
    label:  'PromptPay',
    sub:    'พร้อมเพย์',
    desc:   'รองรับทุกธนาคารในไทย สแกน QR จ่ายได้เลย',
    Icon:   BsQrCodeScan,
    color:  '#1B6EBE',
    bg:     'rgba(27,110,190,0.12)',
    border: 'rgba(27,110,190,0.30)',
    glow:   '0 8px 32px rgba(27,110,190,0.25)',
    badge:  'ยอดนิยม',
  },
  {
    key:    'truemoney',
    label:  'TrueMoney',
    sub:    'วอลเล็ท',
    desc:   'ชำระด้วยเบอร์โทร TrueMoney Wallet',
    Icon:   BsWallet2,
    color:  '#FF6B00',
    bg:     'rgba(255,107,0,0.12)',
    border: 'rgba(255,107,0,0.30)',
    glow:   '0 8px 32px rgba(255,107,0,0.25)',
    badge:  null,
  },
  {
    key:    'card',
    label:  'บัตรเครดิต',
    sub:    'Credit / Debit',
    desc:   'Visa · Mastercard · JCB · Amex',
    Icon:   BsCreditCard2FrontFill,
    color:  '#8B5CF6',
    bg:     'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.30)',
    glow:   '0 8px 32px rgba(139,92,246,0.25)',
    badge:  null,
  },
  {
    key:    'card',
    label:  'Apple Pay',
    sub:    'iOS & macOS',
    desc:   'Safari บน iPhone / Mac',
    Icon:   BsApple,
    color:  '#F1F5F9',
    bg:     'rgba(241,245,249,0.08)',
    border: 'rgba(241,245,249,0.18)',
    glow:   '0 8px 32px rgba(241,245,249,0.12)',
    badge:  null,
  },
  {
    key:    'card',
    label:  'Google Pay',
    sub:    'Android & Chrome',
    desc:   'บัญชี Google ทุกอุปกรณ์',
    Icon:   BsPhone,
    color:  '#34A853',
    bg:     'rgba(52,168,83,0.12)',
    border: 'rgba(52,168,83,0.30)',
    glow:   '0 8px 32px rgba(52,168,83,0.20)',
    badge:  null,
  },
  {
    key:    'link',
    label:  'Stripe Link',
    sub:    'Fast Checkout',
    desc:   'บันทึกข้อมูลชำระอัตโนมัติ',
    Icon:   BsLink45Deg,
    color:  '#635BFF',
    bg:     'rgba(99,91,255,0.12)',
    border: 'rgba(99,91,255,0.30)',
    glow:   '0 8px 32px rgba(99,91,255,0.20)',
    badge:  null,
  },
] as const;

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
    '.Input':          { border: '1px solid rgba(139,92,246,0.18)', backgroundColor: 'rgba(13,18,33,0.8)' },
    '.Input:focus':    { border: '1px solid rgba(139,92,246,0.5)', boxShadow: '0 0 0 3px rgba(139,92,246,0.12)' },
    '.Tab':            { border: '1px solid rgba(139,92,246,0.12)', backgroundColor: 'rgba(139,92,246,0.06)' },
    '.Tab:hover':      { border: '1px solid rgba(139,92,246,0.3)' },
    '.Tab--selected':  { border: '1px solid rgba(139,92,246,0.5)', backgroundColor: 'rgba(139,92,246,0.18)' },
    '.Label':          { color: '#94A3B8' },
  },
};

function CheckoutForm({ amountThb, channelLabel }: { amountThb: number; channelLabel: string }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/topup/success` },
    });
    if (stripeError) {
      setError(stripeError.message ?? 'การชำระเงินล้มเหลว');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#475569] uppercase tracking-widest">ชำระผ่าน {channelLabel}</p>
        <p className="text-[#06B6D4] font-bold font-mono">฿{amountThb.toLocaleString()}</p>
      </div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2.5 rounded-xl">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading
          ? <span className="flex items-center justify-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /> กำลังดำเนินการ...</span>
          : `ชำระเงิน ฿${amountThb.toLocaleString()}`
        }
      </button>
    </form>
  );
}

export default function TopupPage() {
  const [activeChannel, setActiveChannel] = useState<number | null>(null);
  const [selectedAmt,   setSelectedAmt]   = useState<number | null>(null);
  const [clientSecret,  setClientSecret]  = useState('');
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const channel = activeChannel !== null ? CHANNELS[activeChannel] : null;

  async function selectAmount(amt: number) {
    if (activeChannel === null) return;
    setSelectedAmt(amt);
    setClientSecret('');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payment/create-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amountThb:     amt,
          paymentMethod: CHANNELS[activeChannel].key,
        }),
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

  function selectChannel(idx: number) {
    setActiveChannel(idx);
    setSelectedAmt(null);
    setClientSecret('');
    setError('');
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">เติมเงิน</h1>
        <p className="text-[#475569] text-sm mt-0.5">เลือกช่องทางชำระเงิน → เลือกจำนวน → ชำระ</p>
      </div>

      {/* Step 1: Channel selection */}
      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] text-xs font-bold flex items-center justify-center">1</span>
            <p className="text-sm font-semibold text-[#F1F5F9]">เลือกช่องทางชำระเงิน</p>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Powered by Stripe</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CHANNELS.map((ch, idx) => {
            const isActive = activeChannel === idx;
            return (
              <button
                key={`${ch.label}-${idx}`}
                onClick={() => selectChannel(idx)}
                className="relative rounded-2xl p-4 flex flex-col gap-3 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${ch.bg} 0%, rgba(11,14,26,0.8) 100%)`
                    : `linear-gradient(135deg, rgba(11,14,26,0.6) 0%, rgba(11,14,26,0.95) 100%)`,
                  border:     isActive ? `2px solid ${ch.color}` : `1px solid ${ch.border}`,
                  boxShadow:  isActive ? ch.glow : 'none',
                }}
              >
                {/* Selected checkmark */}
                {isActive && (
                  <span className="absolute top-2.5 right-2.5">
                    <BsCheckCircleFill size={16} color={ch.color} />
                  </span>
                )}

                {/* Badge */}
                {ch.badge && !isActive && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: ch.bg, color: ch.color, border: `1px solid ${ch.border}` }}>
                    {ch.badge}
                  </span>
                )}

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background:  isActive ? ch.bg : 'rgba(255,255,255,0.03)',
                    border:      `1px solid ${isActive ? ch.border : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <ch.Icon size={24} color={isActive ? ch.color : '#475569'} />
                </div>

                {/* Text */}
                <div>
                  <p className="font-[family-name:var(--font-jakarta)] font-bold text-sm leading-tight"
                    style={{ color: isActive ? '#F1F5F9' : '#94A3B8' }}>
                    {ch.label}
                  </p>
                  <p className="text-[11px] font-medium mt-0.5" style={{ color: isActive ? ch.color : '#334155' }}>
                    {ch.sub}
                  </p>
                  <p className="text-[10px] text-[#334155] mt-1 leading-snug">{ch.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Amount — shows only after channel selected */}
      {activeChannel !== null && (
        <div className="glass p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] text-xs font-bold flex items-center justify-center">2</span>
            <p className="text-sm font-semibold text-[#F1F5F9]">เลือกจำนวนเงิน</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => selectAmount(amt)}
                disabled={loading && selectedAmt === amt}
                className={[
                  'glass-tab py-3.5 text-sm font-semibold transition-all',
                  selectedAmt === amt ? 'glass-tab-active text-[#c4b5fd]' : 'text-[#94A3B8]',
                ].join(' ')}
              >
                {loading && selectedAmt === amt
                  ? <span className="animate-pulse text-xs">กำลังโหลด...</span>
                  : `฿${amt.toLocaleString()}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] px-3 py-2.5 rounded-xl">
          {error}
        </p>
      )}

      {/* Step 3: Stripe Payment Element */}
      {clientSecret && selectedAmt && channel && (
        <div className="glass p-6 space-y-1"
          style={{ borderColor: channel.border }}>
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <CheckoutForm amountThb={selectedAmt} channelLabel={channel.label} />
          </Elements>
        </div>
      )}
    </main>
  );
}
