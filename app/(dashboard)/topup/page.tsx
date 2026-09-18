'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BsQrCodeScan, BsCheckCircleFill, BsExclamationCircleFill,
  BsArrowRight, BsShieldCheck, BsWallet2, BsGift,
  BsCreditCard2Front, BsLightningChargeFill,
  BsArrowClockwise, BsDownload, BsClock,
} from 'react-icons/bs';
import StripeCardEmbedded from '@/components/StripeCardEmbedded';
import StripeGooglePayEmbedded from '@/components/StripeGooglePayEmbedded';
import { SiGooglepay } from 'react-icons/si';

const PROMPTPAY_AMOUNTS = [10, 20, 50, 100, 150, 200, 300, 500, 1000, 2000, 5000, 10000];
const CARD_AMOUNTS      = [200, 300, 500, 1000, 2000, 5000, 10000];

type PaymentChannelKey = 'promptpay' | 'card' | 'googlepay' | 'truewallet';

interface PaymentChannel {
  key: PaymentChannelKey;
  label: string;
  sub: string;
  badge?: { text: string; color: string; bg: string };
  icon: React.ReactNode;
  color: 'purple' | 'blue' | 'emerald' | 'orange';
}

const CHANNELS: PaymentChannel[] = [
  {
    key: 'promptpay',
    label: 'พร้อมเพย์ (PromptPay)',
    sub: 'รองรับ ธนาคาร / TrueMoney / ShopeePay',
    icon: <BsQrCodeScan />,
    color: 'purple',
  },
  {
    key: 'card',
    label: 'บัตรเครดิต / เดบิต',
    sub: 'ขั้นต่ำ ฿200 • Visa, Mastercard, JCB',
    badge: { text: '-8 เครดิต', color: '#f87171', bg: '#1e1124' },
    icon: <BsCreditCard2Front />,
    color: 'blue',
  },
  {
    key: 'googlepay',
    label: 'Google Pay',
    sub: 'ขั้นต่ำ ฿200 • แตะจ่ายสะดวกในคลิกเดียว',
    badge: { text: '-8 เครดิต', color: '#f87171', bg: '#1e1124' },
    icon: <SiGooglepay className="text-xl" />,
    color: 'emerald',
  },
  {
    key: 'truewallet',
    label: 'TrueMoney Gift',
    sub: 'ซองของขวัญ / วอเลท (ฟรีค่าธรรมเนียม 0%)',
    badge: { text: 'ฟรี 0%', color: '#4ade80', bg: '#0d2218' },
    icon: <BsWallet2 />,
    color: 'orange',
  },
];

const COLOR_MAP = {
  purple:  { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.5)', icon: 'rgba(139,92,246,0.25)', iconText: '#a78bfa' },
  blue:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.5)',  icon: 'rgba(59,130,246,0.2)',   iconText: '#60a5fa' },
  emerald: { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.5)',  icon: 'rgba(16,185,129,0.2)',   iconText: '#34d399' },
  orange:  { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.5)', icon: 'rgba(251,146,60,0.2)',  iconText: '#fb923c' },
};

export default function TopupPage() {
  const [channel, setChannel] = useState<PaymentChannelKey>('promptpay');
  const [amount, setAmount] = useState<number | null>(50);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'pending'; text: string } | null>(null);
  const [voucherInput, setVoucherInput] = useState('');
  const [bonusPct, setBonusPct] = useState(0);

  // สถานะ QR พร้อมเพย์ของ Stripe ที่แสดงบนหน้าเว็บโดยตรง
  const [activeQr, setActiveQr] = useState<{
    intentId: string;
    qrUrl: string;
    amount: number;
    hostedUrl?: string;
  } | null>(null);

  // สถานะ Client Secret สำหรับฟอร์มกรอกบัตรบนหน้าเว็บโดยตรง (ไม่เด้งออก)
  const [cardSecret, setCardSecret] = useState<{
    clientSecret: string;
    intentId: string;
    amount: number;
    netCredit: number;
  } | null>(null);

  // ป๊อปอัปสำเร็จ
  const [successModal, setSuccessModal] = useState<{ amount: number; ref: string } | null>(null);

  // ตัวนับถอยหลัง QR
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 นาที
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.topup_bonus_pct) setBonusPct(Number(data.topup_bonus_pct) || 0);
      })
      .catch(() => {});
  }, []);

  // ตัวจับเวลาถอยหลังสำหรับ QR
  useEffect(() => {
    if (!activeQr) return;
    setTimeLeft(600);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveQr(null);
          setResult({ type: 'error', text: 'QR Code หมดอายุแล้ว กรุณาสร้าง QR ใหม่' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQr]);

  // ระบบดักฟังตรวจจับเงินเข้า Real-time (Polling ตรวจ status ทุก 2 วินาที)
  useEffect(() => {
    if (!activeQr) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/check-intent?id=${activeQr.intentId}`);
        const data = await res.json();
        if (data.status === 'succeeded') {
          if (pollRef.current) clearInterval(pollRef.current);
          const credited = data.amount || activeQr.amount;
          setActiveQr(null);
          setSuccessModal({ amount: credited, ref: data.ref || activeQr.intentId });
          window.dispatchEvent(new Event('smm-data-changed'));
        }
      } catch {}
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeQr]);

  const isCardOrWallet = channel === 'card' || channel === 'googlepay';
  const minRequired = isCardOrWallet ? 200 : 10;
  const currentAmounts = isCardOrWallet ? CARD_AMOUNTS : PROMPTPAY_AMOUNTS;
  const finalAmount = amount ?? (custom ? Number(custom) : null);
  const netCredit = isCardOrWallet && finalAmount ? Math.max(0, finalAmount - 8) : finalAmount;

  // กดชำระเงิน
  async function handlePayment() {
    if (!finalAmount) return;
    const min = isCardOrWallet ? 200 : 10;
    if (finalAmount < min) {
      setResult({
        type: 'error',
        text: isCardOrWallet
          ? 'ยอดชำระขั้นต่ำ ฿200 (หักค่าธรรมเนียม -8 เครดิตทุกกรณี)'
          : 'ยอดชำระผ่านพร้อมเพย์ขั้นต่ำ ฿10 บาท',
      });
      return;
    }

    setLoading(true);
    setResult(null);

    // 1. กรณี พร้อมเพย์ ➔ แสดง QR ของ Stripe บนหน้าเว็บทันที (ไม่เด้งออก)
    if (channel === 'promptpay') {
      try {
        const res = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountThb: finalAmount,
            paymentMethod: 'promptpay',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.qrDataUrl) {
          setResult({ type: 'error', text: data.error || 'ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่อีกครั้ง' });
        } else {
          setActiveQr({
            intentId: data.intentId,
            qrUrl: data.qrDataUrl,
            amount: finalAmount,
            hostedUrl: data.hostedUrl,
          });
        }
      } catch {
        setResult({ type: 'error', text: 'เชื่อมต่อ Stripe ไม่สำเร็จ กรุณาลองใหม่' });
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. กรณี บัตรเครดิต หรือ Google Pay ➔ สร้าง Intent แล้วเปิดฟอร์มบนหน้าเว็บเราโดยตรง (ไม่เด้งออก)
    try {
      const res = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountThb: finalAmount,
          paymentMethod: channel === 'googlepay' ? 'googlepay' : 'card',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        setResult({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Stripe' });
      } else {
        setCardSecret({
          clientSecret: data.clientSecret,
          intentId: data.intentId,
          amount: finalAmount,
          netCredit: netCredit || finalAmount - 8,
        });
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
    setActiveQr(null);
    setCardSecret(null);
    setResult(null);
    if ((key === 'card' || key === 'googlepay') && (!amount || amount < 200)) {
      setAmount(200);
      setCustom('');
    } else if (key === 'promptpay' && (!amount || amount < 10)) {
      setAmount(50);
      setCustom('');
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* ป๊อปอัปเติมเงินสำเร็จ */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="glass w-full max-w-sm rounded-2xl p-8 text-center space-y-5 border border-emerald-500/40"
            style={{ boxShadow: '0 0 60px rgba(16,185,129,0.3)' }}>
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-emerald-500/15 border-2 border-emerald-400">
                <BsCheckCircleFill size={42} className="text-emerald-400 animate-bounce" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-emerald-400 font-bold text-xl">เติมเงินสำเร็จแล้ว!</p>
              <p className="text-4xl font-black text-white font-mono">฿{successModal.amount.toLocaleString()}</p>
              <p className="text-xs text-[#94A3B8] font-mono pt-1">Ref: {successModal.ref}</p>
            </div>
            <p className="text-sm text-[#94A3B8]">ยอดเงินถูกเพิ่มเข้าบัญชีของคุณเรียบร้อยแล้ว</p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSuccessModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-[rgba(139,92,246,0.3)] text-[#94A3B8] hover:text-white transition-all cursor-pointer"
              >
                เติมอีกครั้ง
              </button>
              <Link
                href="/dashboard"
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
              >
                ดูยอดเงิน <BsArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CHANNELS.map(t => {
              const active = channel === t.key;
              const c = COLOR_MAP[t.color];
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selectChannel(t.key)}
                  className="relative flex items-center gap-3.5 p-4 rounded-xl border transition-all text-left cursor-pointer"
                  style={{
                    borderColor: active ? c.border : 'rgba(139,92,246,0.12)',
                    background: active ? c.bg : 'transparent',
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors"
                    style={{
                      background: active ? c.icon : 'rgba(255,255,255,0.04)',
                      color: active ? c.iconText : '#475569',
                    }}
                  >
                    {t.icon}
                  </div>
                  <div className="min-w-0 pr-4">
                    <p className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-[#94A3B8]'}`}>
                      {t.label}
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                      {t.sub}
                    </p>
                  </div>
                  {t.badge && (
                    <span
                      className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight shadow-md border border-white/10 z-10"
                      style={{ color: t.badge.color, background: t.badge.bg, backdropFilter: 'blur(8px)' }}
                    >
                      {t.badge.text}
                    </span>
                  )}
                  {active && (
                    <BsCheckCircleFill size={16} className="absolute top-3.5 right-3.5 shrink-0" style={{ color: c.iconText }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ขั้นตอนที่ 2: STRIPE FLOW (พร้อมเพย์, บัตรเครดิต, GOOGLE PAY) */}
        {(channel === 'promptpay' || channel === 'card' || channel === 'googlepay') && (
          <div className="glass p-5 space-y-4">
            <StepLabel
              n={2}
              text={
                channel === 'promptpay'
                  ? 'เลือกยอดเงินและชำระด้วย พร้อมเพย์ (สแกนจ่ายเงินเข้าทันที)'
                  : channel === 'googlepay'
                  ? 'เลือกยอดเงินและชำระด้วย Google Pay'
                  : 'เลือกยอดเงินและชำระด้วย บัตรเครดิต / เดบิต'
              }
            />

            {/* แถบแจ้งเตือนช่องทางพร้อมเพย์: ยืนยันรองรับ TrueMoney & ShopeePay */}
            {channel === 'promptpay' && (
              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 flex items-start gap-2.5 text-xs text-purple-200">
                <BsLightningChargeFill size={16} className="shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white">รองรับการสแกนผ่านหลากหลายแอปพลิเคชัน</p>
                  <p className="text-[#CBD5E1] leading-relaxed">
                    • <strong>แอปธนาคารไทยทุกแห่ง</strong> (K PLUS, SCB Easy, Krungthai NEXT, Bangkok Bank ฯลฯ)<br />
                    • <strong>TrueMoney Wallet</strong> (เปิดแอปทรูมันนี่ กดปุ่มสแกนจ่ายได้เลย)<br />
                    • <strong>ShopeePay</strong> (เปิดแอป ShopeePay กดปุ่มสแกนจ่ายได้เลย)
                  </p>
                </div>
              </div>
            )}

            {/* ประกาศแจ้งเตือนกรณีบัตรเครดิต */}
            {channel === 'card' && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-300">
                <BsExclamationCircleFill size={16} className="shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-rose-200">ข้อกำหนดการชำระผ่านบัตรเครดิต / เดบิต</p>
                  <p className="text-rose-300/90 leading-relaxed">
                    • <strong>ยอดชำระขั้นต่ำ ฿200 บาท</strong> (ห้ามต่ำกว่า ฿200)<br />
                    • <strong>หักค่าธรรมเนียม -8 เครดิตทุกกรณี</strong> (เช่น ชำระ ฿200 จะได้รับสุทธิ 192 เครดิตเข้ากระเป๋า)<br />
                    • รองรับ <strong>Visa, Mastercard, JCB</strong> (ปลอดภัยมาตรฐานธนาคารระดับสากล)
                  </p>
                </div>
              </div>
            )}

            {/* ประกาศแจ้งเตือนกรณี Google Pay */}
            {channel === 'googlepay' && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-2.5 text-xs text-emerald-300">
                <BsExclamationCircleFill size={16} className="shrink-0 text-emerald-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-200">ข้อกำหนดการชำระผ่าน Google Pay</p>
                  <p className="text-emerald-300/90 leading-relaxed">
                    • <strong>ยอดชำระขั้นต่ำ ฿200 บาท</strong> (ห้ามต่ำกว่า ฿200)<br />
                    • <strong>หักค่าธรรมเนียม -8 เครดิตทุกกรณี</strong> (เช่น ชำระ ฿200 จะได้รับสุทธิ 192 เครดิตเข้ากระเป๋า)<br />
                    • แตะจ่ายสะดวกรวดเร็วผ่าน Google Pay ด้วยบัตรที่บันทึกไว้ในอุปกรณ์ของคุณ
                  </p>
                </div>
              </div>
            )}

            {/* 1. หากผู้ใช้เลือกบัตรหรือ Google Pay และกดชำระเงินแล้ว -> แสดงแบบฟอร์มบนหน้าเว็บโดยตรง (ไม่เด้งออก) */}
            {cardSecret ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.25)]">
                  <div className="space-y-0.5">
                    <span className="text-xs text-[#94A3B8]">
                      {channel === 'googlepay' ? 'ยอดชำระผ่าน Google Pay' : 'ยอดชำระผ่านบัตร'}
                    </span>
                    <p className="text-2xl font-bold text-white font-mono">฿{cardSecret.amount.toLocaleString()}</p>
                    <p className="text-xs text-emerald-400 font-medium">
                      ได้รับสุทธิ: <span className="font-bold">฿{cardSecret.netCredit.toLocaleString()} เครดิต</span> (หักค่าธรรมเนียม -8)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCardSecret(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    ยกเลิก / เปลี่ยนยอด
                  </button>
                </div>

                {channel === 'googlepay' ? (
                  <StripeGooglePayEmbedded
                    clientSecret={cardSecret.clientSecret}
                    amount={cardSecret.amount}
                    netCredit={cardSecret.netCredit}
                    onSwitchToCard={() => selectChannel('card')}
                    onSuccess={async (intentId) => {
                      try {
                        const res = await fetch(`/api/payment/check-intent?id=${intentId}`);
                        const data = await res.json();
                        const cred = data.amount || cardSecret.netCredit;
                        setSuccessModal({ amount: cred, ref: intentId });
                      } catch {
                        setSuccessModal({ amount: cardSecret.netCredit, ref: intentId });
                      }
                      window.dispatchEvent(new Event('smm-data-changed'));
                      setCardSecret(null);
                    }}
                    onError={(errMsg) => {
                      setResult({ type: 'error', text: errMsg });
                    }}
                  />
                ) : (
                  <StripeCardEmbedded
                    clientSecret={cardSecret.clientSecret}
                    amount={cardSecret.amount}
                    netCredit={cardSecret.netCredit}
                    onSuccess={async (intentId) => {
                      try {
                        const res = await fetch(`/api/payment/check-intent?id=${intentId}`);
                        const data = await res.json();
                        const cred = data.amount || cardSecret.netCredit;
                        setSuccessModal({ amount: cred, ref: intentId });
                      } catch {
                        setSuccessModal({ amount: cardSecret.netCredit, ref: intentId });
                      }
                      window.dispatchEvent(new Event('smm-data-changed'));
                      setCardSecret(null);
                    }}
                    onError={(errMsg) => {
                      setResult({ type: 'error', text: errMsg });
                    }}
                  />
                )}
              </div>
            ) : !activeQr ? (
              <>
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
                    {isCardOrWallet && finalAmount ? (
                      <p className="text-[11px] text-rose-300 font-medium">
                        หักค่าธรรมเนียม -8 เครดิต ➔ <span className="font-bold text-emerald-300">ได้รับสุทธิ ฿{(netCredit || 0).toLocaleString()} เครดิต</span>
                      </p>
                    ) : null}
                    {bonusPct > 0 && finalAmount ? (
                      <p className="text-[11px] text-amber-400 font-medium">
                        + โบนัส ฿{(Math.round(finalAmount * bonusPct) / 100).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={!finalAmount || finalAmount < minRequired || loading}
                    className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg cursor-pointer"
                    style={{
                      background: channel === 'promptpay'
                        ? 'linear-gradient(135deg,#7c3aed,#6d28d9)'
                        : channel === 'googlepay'
                        ? 'linear-gradient(135deg,#059669,#047857)'
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
                        สแกนจ่าย พร้อมเพย์ ฿{(finalAmount || 0).toLocaleString()} (เงินเข้าทันที)
                        <BsArrowRight size={14} />
                      </>
                    ) : channel === 'googlepay' ? (
                      <>
                        <SiGooglepay className="text-xl" />
                        ชำระด้วย Google Pay ฿{(finalAmount || 0).toLocaleString()} (สุทธิ {netCredit ? `${netCredit.toLocaleString()} เครดิต` : ''})
                        <BsArrowRight size={14} />
                      </>
                    ) : (
                      <>
                        <BsCreditCard2Front size={16} />
                        กรอกข้อมูลบัตรเพื่อชำระ ฿{(finalAmount || 0).toLocaleString()} (สุทธิ {netCredit ? `${netCredit.toLocaleString()} เครดิต` : ''})
                        <BsArrowRight size={14} />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-[#64748B] flex items-center justify-center gap-1">
                    <BsShieldCheck size={12} className="text-emerald-400" />
                    เมื่อชำระสำเร็จ ระบบจะเติมเครดิตเข้าบัญชีของคุณทันทีอัตโนมัติ 100% (ไม่ต้องอัปโหลดสลิป)
                  </p>
                </div>
              </>
            ) : (
              /* ===== ส่วนแสดง QR CODE พร้อมเพย์ บนหน้าเว็บโดยตรง ===== */
              <div className="flex flex-col items-center space-y-4 py-3">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    พร้อมเพย์ QR Code (Stripe)
                  </div>
                  <p className="text-3xl font-black text-white font-mono mt-1">
                    ฿{activeQr.amount.toLocaleString()}
                  </p>
                </div>

                {/* ป้ายเตือนแอปรองรับ */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 py-0.5">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-medium">
                    🏦 ทุกแอปธนาคารไทย
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-200 text-xs font-medium">
                    🧡 TrueMoney Wallet
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium">
                    🛍️ ShopeePay
                  </span>
                </div>

                {/* ภาพ QR Code ของ Stripe */}
                <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-purple-500/30 max-w-[240px] select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeQr.qrUrl}
                    alt="PromptPay QR Code"
                    className="w-full h-auto aspect-square object-contain"
                  />
                </div>

                {/* ตัวนับเวลาถอยหลัง & สถานะรอเงินเข้า */}
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                    <span className="flex items-center gap-1.5 text-purple-300 font-medium">
                      <BsClock size={13} /> เวลาที่เหลือ:
                    </span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {formatTimer(timeLeft)}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-medium">สแกนจ่ายได้เลย เงินเข้าทันทีอัตโนมัติ (ไม่ต้องส่งสลิป)</span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={activeQr.qrUrl}
                      download="promptpay-qr.png"
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[rgba(139,92,246,0.3)] text-[#94A3B8] hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <BsDownload size={13} /> บันทึกภาพ QR
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveQr(null)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      ยกเลิก / เปลี่ยนยอด
                    </button>
                  </div>
                </div>
              </div>
            )}

            <ResultBanner result={result} />
          </div>
        )}

        {/* ขั้นตอนที่ 2: TRUEMONEY ANGPAO FLOW */}
        {channel === 'truewallet' && (
          <form onSubmit={submitAngpao} className="glass p-5 space-y-4">
            <StepLabel n={2} text="กรอกลิ้งค์หรือรหัสซองของขวัญ TrueMoney Gift (ฟรีค่าธรรมเนียม 0%)" />

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
    </>
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
