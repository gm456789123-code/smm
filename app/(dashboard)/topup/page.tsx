'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import generatePayload from 'promptpay-qr';
import {
  BsBank2, BsQrCodeScan, BsUpload, BsCheckCircleFill,
  BsExclamationCircleFill, BsArrowRight, BsShieldCheck, BsWallet2,
  BsChevronLeft, BsGift, BsClipboard, BsClipboardCheck,
} from 'react-icons/bs';

const AMOUNTS = [10, 20, 50, 100, 150, 300, 500, 1000, 2000, 5000, 10000];

type Channel = 'promptpay' | 'bank' | 'truewallet' | 'angpao';

const CHANNELS: { key: Channel; label: string; sub: string; icon: React.ReactNode; color: 'purple' | 'orange' | 'red' }[] = [
  { key: 'promptpay',  label: 'พร้อมเพย์',        sub: 'สแกน QR แล้วแนบสลิป',   icon: <BsQrCodeScan />, color: 'purple' },
  { key: 'bank',       label: 'โอนธนาคาร',        sub: 'โอนเข้าบัญชีแล้วแนบสลิป', icon: <BsBank2 />,      color: 'purple' },
  { key: 'truewallet', label: 'TrueMoney Wallet',  sub: 'โอนเข้าวอเลทแล้วแนบสลิป', icon: <BsWallet2 />,    color: 'orange' },
  { key: 'angpao',     label: 'ซองของขวัญ TrueMoney', sub: 'ฟรีค่าธรรมเนียม 0% เงินเข้าทันที', icon: <BsGift />, color: 'red' },
];

const COLOR_MAP = {
  purple: { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.5)', icon: 'rgba(139,92,246,0.25)', iconText: '#a78bfa' },
  orange: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.5)', icon: 'rgba(251,146,60,0.2)',  iconText: '#fb923c' },
  red:    { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.5)',  icon: 'rgba(239,68,68,0.2)',   iconText: '#f87171' },
};

export default function TopupPage() {
  const [channel, setChannel] = useState<Channel>('promptpay');

  const [bankName, setBankName] = useState('ธนาคาร');
  const [accountName, setAccountName] = useState('ชื่อบัญชี');
  const [accountNo, setAccountNo] = useState('');
  const [promptpay, setPromptpay] = useState('');
  const [trueId, setTrueId] = useState('');
  const [bonusPct, setBonusPct] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        if (data.bank_name) setBankName(data.bank_name);
        if (data.bank_account_name) setAccountName(data.bank_account_name);
        if (data.bank_account_number) setAccountNo(data.bank_account_number);
        if (data.promptpay_number) setPromptpay(data.promptpay_number);
        if (data.truewallet_id) setTrueId(data.truewallet_id);
        if (data.topup_bonus_pct) setBonusPct(Number(data.topup_bonus_pct) || 0);
      })
      .catch(() => {});
  }, []);

  function copyAccNo() {
    if (!accountNo) return;
    navigator.clipboard.writeText(accountNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const [amount,    setAmount]    = useState<number | null>(null);
  const [custom,    setCustom]    = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<{ type: 'success' | 'error' | 'pending'; text: string } | null>(null);
  const [voucherInput, setVoucherInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const finalAmount = amount ?? (custom ? Number(custom) : null);

  const qrPayload = useMemo(() => {
    if (channel !== 'promptpay' || !promptpay || !confirmed || !finalAmount) return null;
    try { return generatePayload(promptpay, { amount: finalAmount }); }
    catch { return null; }
  }, [channel, promptpay, confirmed, finalAmount]);

  function switchChannel(key: Channel) {
    setChannel(key);
    setConfirmed(false);
    setFile(null); setPreview(null); setResult(null);
    setVoucherInput('');
  }

  function pickFile(f: File) { setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) pickFile(f); }
  function onDrop(e: React.DragEvent) { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pickFile(f); }

  function resetAmount() {
    setConfirmed(false);
    setFile(null); setPreview(null); setResult(null);
  }

  async function submitSlip(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !finalAmount) return;
    setLoading(true); setResult(null);
    const form = new FormData();
    form.append('file', file);
    form.append('channel', channel);
    form.append('amount', String(finalAmount));
    try {
      const res  = await fetch('/api/payment/submit-slip', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' });
      } else {
        setResult({ type: 'pending', text: 'ส่งสลิปให้แอดมินแล้ว รอตรวจสอบและอนุมัติยอดภายใน 5–15 นาที' });
        setFile(null); setPreview(null); setAmount(null); setCustom(''); setConfirmed(false);
      }
    } catch {
      setResult({ type: 'error', text: 'เชื่อมต่อไม่ได้ กรุณาลองใหม่' });
    } finally { setLoading(false); }
  }

  async function submitAngpao(e: React.FormEvent) {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res  = await fetch('/api/payment/angpao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucher: voucherInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' });
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
    } finally { setLoading(false); }
  }

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">เติมเงิน</h1>
        <p className="text-[#94A3B8] text-sm mt-0.5">โอนเงินแล้วแนบสลิป แอดมินตรวจสอบและอนุมัติยอดให้ภายในไม่กี่นาที</p>
      </div>

      {bonusPct > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/8">
          <BsGift size={16} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            รับโบนัสเพิ่ม <span className="font-bold">{bonusPct}%</span> ทุกยอดเติมเงิน
          </p>
        </div>
      )}

      {/* Step 1: ช่องทาง */}
      <div className="glass p-5 space-y-3">
        <StepLabel n={1} text="เลือกช่องทางชำระเงิน" />
        <div className="grid grid-cols-2 gap-3">
          {CHANNELS.map(t => {
            const active = channel === t.key;
            const c = COLOR_MAP[t.color];
            return (
              <button key={t.key} type="button" onClick={() => switchChannel(t.key)}
                className="relative flex items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer"
                style={{
                  borderColor: active ? c.border : 'rgba(139,92,246,0.12)',
                  background:  active ? c.bg     : 'transparent',
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-colors"
                  style={{
                    background: active ? c.icon     : 'rgba(255,255,255,0.04)',
                    color:      active ? c.iconText : '#475569',
                  }}>
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-tight truncate ${active ? 'text-white' : 'text-[#94A3B8]'}`}>{t.label}</p>
                  <p className="text-[10px] text-[#64748B] mt-0.5 leading-snug truncate">{t.sub}</p>
                </div>
                {active && <BsCheckCircleFill size={14} className="absolute top-3 right-3 shrink-0" style={{ color: c.iconText }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== ANGPAO FLOW ===== */}
      {channel === 'angpao' && (
        <form onSubmit={submitAngpao} className="glass p-5 space-y-4">
          <StepLabel n={2} text="กรอกลิ้งหรือโค้ดซองอั้งเปา" />

          <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-rose-500/40 bg-rose-500/10">
            <BsExclamationCircleFill size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-rose-300 font-bold text-sm">มูลค่าซองขั้นต่ำ ฿10</p>
              <p className="text-rose-400/80 text-xs leading-relaxed">
                หากซองมีมูลค่าต่ำกว่า ฿10 ระบบจะ<span className="font-semibold text-rose-300">ไม่เติมเครดิตให้</span> กรุณาติดต่อแอดมิน
              </p>
            </div>
          </div>

          <div className="glass rounded-xl p-4 space-y-2 border border-[rgba(239,68,68,0.15)]">
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">ตัวอย่างรูปแบบที่รองรับ</p>
            <p className="text-xs text-[#94A3B8] font-mono">https://gift.truemoney.com/campaign/?v=ABCD1234</p>
            <p className="text-xs text-[#94A3B8] font-mono">ABCD1234</p>
          </div>

          <input
            type="text"
            value={voucherInput}
            onChange={e => { setVoucherInput(e.target.value); setResult(null); }}
            placeholder="วางลิ้งหรือโค้ดซองที่นี่..."
            autoFocus
            className="w-full px-4 py-3.5 text-sm text-white bg-[rgba(255,255,255,0.06)] outline-none placeholder-[#64748B] rounded-xl border border-[rgba(139,92,246,0.4)] focus:border-[#a78bfa] focus:bg-[rgba(255,255,255,0.09)] transition-all"
          />

          <button type="submit" disabled={!voucherInput.trim() || loading}
            className="w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}>
            {loading
              ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> กำลัง Redeem...</>
              : <><BsGift size={15} /> รับซองอั้งเปา</>}
          </button>

          <ResultBanner result={result} />
        </form>
      )}

      {/* ===== SLIP FLOW (promptpay / bank / truewallet) ===== */}
      {channel !== 'angpao' && (
        <>
          {/* Step 2: เลือกยอด */}
          <div className="glass p-5 space-y-3">
            <StepLabel n={2} text="เลือกยอดที่จะเติม" />
            {!confirmed ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {AMOUNTS.map((a, i) => (
                    <button key={a} type="button" onClick={() => { setAmount(a); setCustom(''); }}
                      className={[
                        'glass-tab py-2.5 text-sm font-semibold transition-all cursor-pointer',
                        i === AMOUNTS.length - 1 && AMOUNTS.length % 4 !== 0 ? 'col-span-4' : '',
                        amount === a && !custom ? 'glass-tab-active text-[#c4b5fd]' : 'text-[#94A3B8]',
                      ].join(' ')}>
                      ฿{a.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input type="number" value={custom}
                  onChange={e => { setCustom(e.target.value); setAmount(null); }}
                  placeholder="หรือกรอกจำนวนเอง..."
                  className="w-full glass px-4 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
                />
                <button type="button" onClick={() => setConfirmed(true)}
                  disabled={!finalAmount || finalAmount < 10}
                  className="btn-primary w-full py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer">
                  {finalAmount && finalAmount < 10
                    ? 'ยอดขั้นต่ำ ฿10'
                    : <>ยืนยันยอด {finalAmount ? `฿${finalAmount.toLocaleString()}` : ''} <BsArrowRight size={14} /></>
                  }
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)]">
                <div>
                  <p className="text-xs text-[#94A3B8]">ยอดที่เลือก</p>
                  <p className="text-xl font-bold text-white font-mono">฿{finalAmount!.toLocaleString()}</p>
                  {bonusPct > 0 && (
                    <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                      + โบนัส ฿{(Math.round(finalAmount! * bonusPct) / 100).toLocaleString()}
                    </p>
                  )}
                </div>
                <button type="button" onClick={resetAmount}
                  className="flex items-center gap-1.5 text-xs text-[#a78bfa] hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-[rgba(139,92,246,0.25)] hover:bg-[rgba(139,92,246,0.12)] cursor-pointer">
                  <BsChevronLeft size={11} /> แก้ไข
                </button>
              </div>
            )}
          </div>

          {/* Step 3: รายละเอียด */}
          {confirmed && (
            <div className="glass p-5 space-y-4">
              <StepLabel n={3} text={
                channel === 'promptpay' ? 'สแกน QR พร้อมเพย์' :
                channel === 'bank'      ? 'โอนเข้าบัญชีนี้'   : 'โอนเข้า TrueMoney Wallet นี้'
              } />

              {channel === 'promptpay' && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="relative p-4 bg-white rounded-2xl shadow-lg select-none">
                    {qrPayload
                      ? <QRCode value={qrPayload} size={192} />
                      : <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center px-4">ยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์ กรุณาติดต่อแอดมิน</span>
                        </div>
                    }
                  </div>
                  {promptpay && <p className="text-sm text-[#06B6D4] font-mono font-bold">{promptpay}</p>}
                  <div className="text-center">
                    <p className="text-xs text-[#94A3B8]">ยอดที่ต้องโอน</p>
                    <p className="text-2xl font-bold text-white font-mono">฿{finalAmount!.toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-[#94A3B8]">สแกนด้วยแอปธนาคารหรือ TrueMoney Wallet</p>
                </div>
              )}

              {channel === 'bank' && (
                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
                      <BsBank2 size={18} className="text-[#a78bfa]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8]">ธนาคาร</p>
                      <p className="text-sm font-semibold text-white">{bankName}</p>
                    </div>
                  </div>
                  <div className="border-t border-[rgba(139,92,246,0.08)] pt-3 space-y-3">
                    <div>
                      <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">ชื่อบัญชี</p>
                      <p className="text-sm text-white font-medium mt-0.5">{accountName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">เลขบัญชี</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-base font-bold font-mono text-[#06B6D4] tracking-widest">{accountNo || 'กรุณาติดต่อแอดมิน'}</p>
                        {accountNo && (
                          <button type="button" onClick={copyAccNo}
                            className="text-[#94A3B8] hover:text-[#06B6D4] transition-colors cursor-pointer">
                            {copied ? <BsClipboardCheck size={14} className="text-emerald-400" /> : <BsClipboard size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[rgba(139,92,246,0.08)]">
                      <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">ยอดที่ต้องโอน</p>
                      <p className="text-2xl font-bold font-mono text-white mt-0.5">฿{finalAmount!.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {channel === 'truewallet' && (
                <div className="glass rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[rgba(251,146,60,0.15)] flex items-center justify-center">
                      <BsWallet2 size={18} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8]">ช่องทาง</p>
                      <p className="text-sm font-semibold text-white">TrueMoney Wallet</p>
                    </div>
                  </div>
                  {trueId ? (
                    <div className="border-t border-[rgba(251,146,60,0.08)] pt-3 space-y-2">
                      <div>
                        <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">เบอร์ / True ID</p>
                        <p className="text-base font-bold font-mono text-orange-400 tracking-widest mt-0.5">{trueId}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">ยอดที่ต้องโอน</p>
                        <p className="text-2xl font-bold font-mono text-white mt-0.5">฿{finalAmount!.toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#94A3B8]">กรุณาตั้งค่าเบอร์ TrueMoney ในระบบ</p>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 text-[11px] text-[#94A3B8] bg-[rgba(6,182,212,0.04)] border border-[rgba(6,182,212,0.12)] rounded-xl px-3 py-2.5">
                <BsShieldCheck size={13} className="text-[#06B6D4] shrink-0 mt-0.5" />
                หลังโอนเงินแล้ว แนบภาพสลิปด้านล่าง แอดมินจะตรวจสอบและอนุมัติยอดให้ภายในไม่กี่นาที
              </div>
            </div>
          )}

          {/* Step 4: อัปโหลดสลิป */}
          {confirmed && (
            <form onSubmit={submitSlip} className="glass p-5 space-y-4">
              <StepLabel n={4} text="แนบสลิปโอนเงิน" />

              <div onClick={() => fileRef.current?.click()} onDrop={onDrop} onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-[rgba(139,92,246,0.25)] hover:border-[rgba(139,92,246,0.5)] rounded-xl transition-colors cursor-pointer overflow-hidden"
                style={{ minHeight: 160 }}>
                {preview
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="สลิป" className="w-full max-h-64 object-contain p-2" />
                  )
                  : (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
                      <div className="w-12 h-12 rounded-2xl bg-[rgba(139,92,246,0.08)] flex items-center justify-center">
                        <BsUpload size={22} className="text-[#94A3B8]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-[#CBD5E1]">คลิกหรือลากไฟล์มาวางที่นี่</p>
                        <p className="text-xs text-[#64748B] mt-0.5">PNG, JPG, WEBP — ไม่เกิน 5MB</p>
                      </div>
                    </div>
                  )}
              </div>

              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFileChange} className="hidden" />

              {file && (
                <div className="flex items-center justify-between text-xs text-[#94A3B8] bg-[rgba(139,92,246,0.06)] rounded-xl px-3 py-2">
                  <span className="truncate">{file.name}</span>
                  <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                    className="text-[#94A3B8] hover:text-rose-400 ml-2 shrink-0 transition-colors cursor-pointer">✕</button>
                </div>
              )}

              <button type="submit" disabled={!file || loading}
                className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none cursor-pointer">
                {loading
                  ? <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> กำลังส่งสลิป...</>
                  : <><BsShieldCheck size={15} /> ส่งสลิปให้แอดมินตรวจสอบ</>}
              </button>

              <ResultBanner result={result} />
            </form>
          )}
        </>
      )}
    </main>
  );
}

function ResultBanner({ result }: { result: { type: 'success' | 'error' | 'pending'; text: string } | null }) {
  if (!result) return null;
  const isPending = result.type === 'pending';
  const isSuccess = result.type === 'success';
  return (
    <div className={['flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border',
      isSuccess  ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400' :
      isPending  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                   'bg-rose-500/8 border-rose-500/20 text-rose-400'].join(' ')}>
      {isSuccess
        ? <BsCheckCircleFill size={15} className="shrink-0 mt-0.5" />
        : isPending
        ? <span className="shrink-0 mt-0.5 text-base">⏳</span>
        : <BsExclamationCircleFill size={15} className="shrink-0 mt-0.5" />}
      <div>
        {result.text}
        {isSuccess && (
          <Link href="/dashboard" className="ml-2 underline text-emerald-300 text-xs hover:text-emerald-200 inline-flex items-center gap-1">
            ไปหน้าหลัก <BsArrowRight size={10} />
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
