'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BsQrCodeScan, BsCheckCircleFill, BsExclamationCircleFill,
  BsArrowRight, BsShieldCheck, BsWallet2, BsGift,
  BsCreditCard2Front, BsLockFill, BsLightningChargeFill,
} from 'react-icons/bs';

const PROMPTPAY_AMOUNTS = [10, 20, 50, 100, 150, 300, 500, 1000, 2000, 5000, 10000];
const CARD_AMOUNTS      = [150, 300, 500, 1000, 2000, 5000, 10000];

type PaymentChannelKey = 'promptpay' | 'card' | 'truewallet';

interface PaymentChannel {
  key: PaymentChannelKey;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'orange';
}

const CHANNELS: PaymentChannel[] = [
  {
    key: 'promptpay',
    label: 'พร้อมเพย์ (PromptPay)',
    sub: 'ขั้นต่ำ ฿10 • เงินเข้าทันที (อัตโนมัติ)',
    icon: <BsQrCodeScan />,
    color: 'purple',
  },
  {
    key: 'card',
    label: 'บัตรเครดิต / เดบิต',
    sub: 'ขั้นต่ำ ฿150 • Visa/Mastercard (Stripe)',
    icon: <BsCreditCard2Front />,
    color: 'blue',
  },
  {
    key: 'truewallet',
    label: 'TrueMoney',
    sub: 'ซองของขวัญ / วอเลท',
    icon: <BsWallet2 />,
    color: 'orange',
  },
];

const COLOR_MAP = {
  purple: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.5)', icon: 'rgba(139,92,246,0.25)', iconText: '#a78bfa' },
  blue:   { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.5)',  icon: 'rgba(59,130,246,0.2)',   iconText: '#60a5fa' },
  orange: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.5)', icon: 'rgba(251,146,60,0.2)',  iconText: '#fb923c' },
};

export default function TopupPage() {
  const [channel, setChannel] = useState<PaymentChannelKey>('promptpay');
  const [amount, setAmount] = useState<number | null>(50);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'pending'; text: string } | null>(null);
  const [voucherInput, setVoucherInput] = useState('');
  const [bonusPct, setBonusPct] = useState(0);

  useEffect(() => {
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.topup_bonus_pct) setBonusPct(Number(data.topup_bonus_pct) || 0);
      })
      .catch(() => {});
  }, []);

  const minRequired = channel === 'card' ? 150 : 10;
  const currentAmounts = channel === 'card' ? CARD_AMOUNTS : PROMPTPAY_AMOUNTS;
  const finalAmount = amount ?? (custom ? Number(custom) : null);
  const netCredit = channel === 'card' && finalAmount ? Math.max(0, finalAmount - 5) : finalAmount;

  // เรียก Stripe Checkout (รองรับทั้ง PromptPay และ Card อัตโนมัติ 100% ไม่มีอัปโหลดสลิป)
  async function submitStripe(method: 'promptpay' | 'card') {
    const min = method === 'card' ? 150 : 10;
    if (!finalAmount || finalAmount < min) {
      setResult({
        type: 'error',
        text: method === 'card'
          ? 'ยอดชำระผ่านบัตรเครดิตต้องไม่ต่ำกว่า ฿150 (หักค่าธรรมเนียม -5 เครดิตทุกกรณี)'
          : 'ยอดชำระผ่านพร้อมเพย์ขั้นต่ำ ฿10 บาท',
      });
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountThb: finalAmount,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setResult({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Stripe' });
      } else {
        window.location.href = data.url;
      }
    } catch {
      setResult({ type: 'error', text: 'เชื่อมต่อ Stripe ไม่สำเร็จ กรุณาลองใหม่' });
    } finally {
      setLoading(false);
    }
  }

  // เติมเงินผ่านซองอั่งเปา TrueMoney
  async function submitAngpao(e: React.FormEvent) {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/payment/angpao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucher: voucherInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาดในการรับซอง' });
      } else if (data.pending) {
        setResult({ type: 'pending', text: 'ส่งรหัสซองให้แอดมินแล้ว รอการตรวจสอบและเติมเงินภายใน 5–15 นาที' });
        setVoucherInput('');
      } else {
        setResult({ type: 'success', text: `รับซองสำเร็จ +฿${Number(data.amount).toLocaleString()} เครดิตเข้าบัญชีแล้ว` });
        window.dispatchEvent(new Event('smm-data-changed'));
        setVoucherInput('');
      }
    } catch {
      setResult({ type: 'error', text: 'เชื่อมต่อไม่ได้ กรุณาลองใหม่' });
    } finally {
      setLoading(false);
    }
  }

  function selectChannel(key: PaymentChannelKey) {
    setChannel(key);
    setResult(null);
    if (key === 'card' && (!amount || amount < 150)) {
      setAmount(150);
      setCustom('');
    } else if (key === 'promptpay' && (!amount || amount < 10)) {
      setAmount(50);
      setCustom('');
    }
  }

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">เติมเงิน</h1>
        <p className="text-[#94A3B8] text-sm mt-0.5">ระบบอัตโนมัติเต็มรูปแบบ — สแกนจ่ายแล้วเงินเข้าทันที 1 วินาที ไม่ต้องอัปโหลดสลิป</p>
      </div>

      {bonusPct > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8">
          <BsGift size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            รับโบนัสพิเศษเพิ่ม <span className="font-bold">{bonusPct}%</span> ทุกยอดเติมเงิน
          </p>
        </div>
      )}

      {/* ขั้นตอนที่ 1: เลือกช่องทาง */}
      <div className="glass p-5 space-y-3">
        <StepLabel n={1} text="เลือกช่องทางชำระเงิน" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CHANNELS.map(t => {
            const active = channel === t.key;
            const c = COLOR_MAP[t.color];
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => selectChannel(t.key)}
                className="relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer"
                style={{
                  borderColor: active ? c.border : 'rgba(139,92,246,0.12)',
                  background: active ? c.bg : 'transparent',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors"
                  style={{
                    background: active ? c.icon : 'rgba(255,255,255,0.04)',
                    color: active ? c.iconText : '#475569',
                  }}
                >
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight truncate ${active ? 'text-white' : 'text-[#94A3B8]'}`}>
                    {t.label}
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug truncate">
                    {t.sub}
                  </p>
                </div>
                {active && (
                  <BsCheckCircleFill size={14} className="absolute top-3 right-3 shrink-0" style={{ color: c.iconText }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ขั้นตอนที่ 2: STRIPE FLOW (พร้อมเพย์ & บัตรเครดิต) */}
      {(channel === 'promptpay' || channel === 'card') && (
        <div className="glass p-5 space-y-4">
          <StepLabel
            n={2}
            text={
              channel === 'promptpay'
                ? 'เลือกยอดเงินและชำระด้วย พร้อมเพย์ (สแกนจ่ายเงินเข้าทันที)'
                : 'เลือกยอดเงินและชำระด้วย บัตรเครดิต / เดบิต'
            }
          />

          {/* ประกาศแจ้งเตือนกรณีบัตรเครดิต */}
          {channel === 'card' && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-300">
              <BsExclamationCircleFill size={16} className="shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-200">ข้อกำหนดการชำระผ่านบัตรเครดิต / เดบิต</p>
                <p className="text-rose-300/90 leading-relaxed">
                  • <strong>ยอดชำระขั้นต่ำ ฿150 บาท</strong> (ห้ามต่ำกว่า ฿150)<br />
                  • <strong>หักค่าธรรมเนียม -5 เครดิตทุกกรณี</strong> (เช่น ชำระ ฿150 จะได้รับสุทธิ 145 เครดิตเข้ากระเป๋า)
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {currentAmounts.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => { setAmount(a); setCustom(''); }}
                className={[
                  'glass-tab py-2.5 text-sm font-semibold transition-all cursor-pointer',
                  amount === a && !custom ? 'glass-tab-active text-[#a78bfa]' : 'text-[#94A3B8]',
                ].join(' ')}
              >
                ฿{a.toLocaleString()}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={custom}
            onChange={e => { setCustom(e.target.value); setAmount(null); }}
            placeholder={`หรือกรอกจำนวนเอง (ขั้นต่ำ ฿${minRequired})...`}
            className="w-full glass px-4 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[#a78bfa] transition-colors"
          />

          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)]">
            <div className="space-y-0.5">
              <p className="text-xs text-[#94A3B8]">ยอดที่ต้องชำระ</p>
              <p className="text-2xl font-bold text-white font-mono">฿{(finalAmount || 0).toLocaleString()}</p>
              {channel === 'card' && finalAmount ? (
                <p className="text-[11px] text-rose-300 font-medium">
                  หักค่าธรรมเนียม -5 เครดิต ➔ <span className="font-bold text-emerald-300">ได้รับสุทธิ ฿{(netCredit || 0).toLocaleString()} เครดิต</span>
                </p>
              ) : null}
              {bonusPct > 0 && finalAmount ? (
                <p className="text-[11px] text-amber-400 font-medium">
                  + โบนัส ฿{(Math.round(finalAmount * bonusPct) / 100).toLocaleString()}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#a78bfa]">
              <BsLockFill size={12} /> ปลอดภัยมาตรฐาน Stripe
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => submitStripe(channel === 'promptpay' ? 'promptpay' : 'card')}
              disabled={!finalAmount || finalAmount < minRequired || loading}
              className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg cursor-pointer"
              style={{
                background: channel === 'promptpay'
                  ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                  : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              }}
            >
              {loading ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  กำลังเปิดระบบชำระเงิน...
                </>
              ) : channel === 'promptpay' ? (
                <>
                  <BsLightningChargeFill size={16} />
                  สแกนจ่าย พร้อมเพย์ {finalAmount ? `฿${finalAmount.toLocaleString()}` : ''} (เงินเข้าทันที)
                  <BsArrowRight size={14} />
                </>
              ) : (
                <>
                  <BsCreditCard2Front size={16} />
                  ชำระผ่านบัตร {finalAmount ? `฿${finalAmount.toLocaleString()}` : ''} (สุทธิ {netCredit ? `${netCredit.toLocaleString()} เครดิต` : ''})
                  <BsArrowRight size={14} />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-[#64748B] flex items-center justify-center gap-1">
              <BsShieldCheck size={12} className="text-emerald-400" />
              เมื่อชำระสำเร็จ ระบบจะเติมเครดิตเข้าบัญชีของคุณทันทีอัตโนมัติ 100% (ไม่ต้องอัปโหลดสลิป)
            </p>
          </div>

          <ResultBanner result={result} />
        </div>
      )}

      {/* ขั้นตอนที่ 2: TRUEMONEY ANGPAO FLOW */}
      {channel === 'truewallet' && (
        <form onSubmit={submitAngpao} className="glass p-5 space-y-4">
          <StepLabel n={2} text="กรอกลิ้งค์หรือรหัสซองของขวัญ TrueMoney" />

          <div className="glass rounded-xl p-4 space-y-2 border border-[rgba(239,68,68,0.15)] bg-rose-500/5">
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">รูปแบบลิ้งค์ที่รองรับ</p>
            <p className="text-xs text-[#94A3B8] font-mono">https://gift.truemoney.com/campaign/?v=ABCD1234</p>
            <p className="text-xs text-[#94A3B8] font-mono">หรือใส่เฉพาะรหัสท้าย เช่น ABCD1234</p>
          </div>

          <input
            type="text"
            value={voucherInput}
            onChange={e => { setVoucherInput(e.target.value); setResult(null); }}
            placeholder="วางลิ้งค์ซองของขวัญที่นี่..."
            autoFocus
            className="w-full px-4 py-3.5 text-sm text-white bg-[rgba(255,255,255,0.06)] outline-none placeholder-[#64748B] rounded-xl border border-[rgba(251,146,60,0.4)] focus:border-orange-400 focus:bg-[rgba(255,255,255,0.09)] transition-all"
          />

          <button
            type="submit"
            disabled={!voucherInput.trim() || loading}
            className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
          >
            {loading ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                กำลังตรวจสอบซอง...
              </>
            ) : (
              <>
                <BsGift size={15} /> รับยอดเงินจากซองทันที
              </>
            )}
          </button>

          <ResultBanner result={result} />
        </form>
      )}
    </main>
  );
}

function ResultBanner({ result }: { result: { type: 'success' | 'error' | 'pending'; text: string } | null }) {
  if (!result) return null;
  const isPending = result.type === 'pending';
  const isSuccess = result.type === 'success';
  return (
    <div
      className={[
        'flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border',
        isSuccess
          ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
          : isPending
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-rose-500/8 border-rose-500/20 text-rose-400',
      ].join(' ')}
    >
      {isSuccess ? (
        <BsCheckCircleFill size={15} className="shrink-0 mt-0.5" />
      ) : isPending ? (
        <span className="shrink-0 mt-0.5 text-base">⏳</span>
      ) : (
        <BsExclamationCircleFill size={15} className="shrink-0 mt-0.5" />
      )}
      <div>
        {result.text}
        {isSuccess && (
          <Link href="/dashboard" className="ml-2 underline text-emerald-300 text-xs hover:text-emerald-200 inline-flex items-center gap-1">
            ไปหน้าแดชบอร์ด <BsArrowRight size={10} />
          </Link>
        )}
      </div>
    </div>
  );
}

function StepLabel({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] text-xs font-bold flex items-center justify-center shrink-0">
        {n}
      </span>
      <p className="text-sm font-semibold text-white">{text}</p>
    </div>
  );
}
