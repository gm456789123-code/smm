'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  BsBank2, BsQrCodeScan, BsUpload, BsCheckCircleFill,
  BsExclamationCircleFill, BsArrowRight, BsShieldCheck,
} from 'react-icons/bs';

const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME           ?? 'ธนาคาร';
const ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME   ?? 'ชื่อบัญชี';
const ACCOUNT_NO   = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? 'xxx-x-xxxxx-x';
const PROMPTPAY    = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER     ?? '';

const AMOUNTS = [50, 100, 300, 500, 1000, 2000, 5000];

export default function TopupPage() {
  const [amount,   setAmount]   = useState<number | null>(null);
  const [custom,   setCustom]   = useState('');
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);

    const form = new FormData();
    form.append('file', file);

    try {
      const res  = await fetch('/api/payment/verify-slip', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) {
        setResult({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' });
      } else {
        setResult({
          type: 'success',
          text: `เติมเงินสำเร็จ ฿${Number(data.amount).toLocaleString()} (Ref: ${data.ref})`,
        });
        setFile(null);
        setPreview(null);
        setAmount(null);
        setCustom('');
      }
    } catch {
      setResult({ type: 'error', text: 'เชื่อมต่อไม่ได้ กรุณาลองใหม่' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">เติมเงิน</h1>
        <p className="text-[#475569] text-sm mt-0.5">โอนเงินเข้าบัญชีด้านล่าง แล้วอัปโหลดสลิป</p>
      </div>

      {/* Bank account info */}
      <div className="glass p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] text-xs font-bold flex items-center justify-center">1</span>
          <p className="text-sm font-semibold text-white">โอนเงินเข้าบัญชีนี้</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Account details */}
          <div className="flex-1 glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
                <BsBank2 size={18} className="text-[#a78bfa]" />
              </div>
              <div>
                <p className="text-xs text-[#475569]">ธนาคาร</p>
                <p className="text-sm font-semibold text-white">{BANK_NAME}</p>
              </div>
            </div>
            <div className="border-t border-[rgba(139,92,246,0.08)] pt-3 space-y-2">
              <div>
                <p className="text-[10px] text-[#475569] uppercase tracking-widest">ชื่อบัญชี</p>
                <p className="text-sm text-white font-medium mt-0.5">{ACCOUNT_NAME}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#475569] uppercase tracking-widest">เลขบัญชี</p>
                <p className="text-base font-bold font-mono text-[#06B6D4] tracking-widest mt-0.5">{ACCOUNT_NO}</p>
              </div>
            </div>
          </div>

          {/* PromptPay QR placeholder */}
          {PROMPTPAY && (
            <div className="flex flex-col items-center gap-2 glass rounded-xl p-4 w-full sm:w-40 shrink-0">
              <div className="flex items-center gap-1.5">
                <BsQrCodeScan size={13} className="text-[#475569]" />
                <p className="text-[10px] text-[#475569] uppercase tracking-widest">พร้อมเพย์</p>
              </div>
              <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center">
                <p className="text-[8px] text-black text-center px-1 font-mono">{PROMPTPAY}</p>
              </div>
              <p className="text-[10px] text-[#475569] text-center">{PROMPTPAY}</p>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-[#475569] bg-[rgba(6,182,212,0.04)] border border-[rgba(6,182,212,0.12)] rounded-xl px-3 py-2.5">
          <BsShieldCheck size={13} className="text-[#06B6D4] shrink-0 mt-0.5" />
          ระบบจะยืนยันสลิปอัตโนมัติผ่าน EasySlip และเติมยอดเงินทันที ใช้เวลาไม่เกิน 1 นาที
        </div>
      </div>

      {/* Amount selector (optional reference) */}
      <div className="glass p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] text-xs font-bold flex items-center justify-center">2</span>
          <p className="text-sm font-semibold text-white">จำนวนเงินที่โอน <span className="text-[#334155] font-normal text-xs">(สำหรับอ้างอิง)</span></p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {AMOUNTS.map(a => (
            <button key={a} type="button" onClick={() => { setAmount(a); setCustom(''); }}
              className={[
                'glass-tab py-2.5 text-sm font-semibold transition-all',
                amount === a && !custom ? 'glass-tab-active text-[#c4b5fd]' : 'text-[#94A3B8]',
              ].join(' ')}>
              ฿{a.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          type="number" value={custom}
          onChange={e => { setCustom(e.target.value); setAmount(null); }}
          placeholder="หรือกรอกจำนวนเอง..."
          className="w-full glass px-4 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
        />
      </div>

      {/* Slip upload */}
      <form onSubmit={submit} className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] text-xs font-bold flex items-center justify-center">3</span>
          <p className="text-sm font-semibold text-white">อัปโหลดสลิปโอนเงิน</p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="relative border-2 border-dashed border-[rgba(139,92,246,0.25)] hover:border-[rgba(139,92,246,0.5)] rounded-xl transition-colors cursor-pointer overflow-hidden"
          style={{ minHeight: 160 }}
        >
          {preview ? (
            <img src={preview} alt="slip preview" className="w-full max-h-64 object-contain p-2" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(139,92,246,0.08)] flex items-center justify-center">
                <BsUpload size={22} className="text-[#475569]" />
              </div>
              <div className="text-center">
                <p className="text-sm text-[#CBD5E1]">คลิกหรือลากไฟล์มาวางที่นี่</p>
                <p className="text-xs text-[#334155] mt-0.5">PNG, JPG, WEBP — ไม่เกิน 5MB</p>
              </div>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />

        {file && (
          <div className="flex items-center justify-between text-xs text-[#475569] bg-[rgba(139,92,246,0.06)] rounded-xl px-3 py-2">
            <span className="truncate">{file.name}</span>
            <button type="button" onClick={() => { setFile(null); setPreview(null); }}
              className="text-[#475569] hover:text-rose-400 ml-2 shrink-0 transition-colors">✕</button>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="btn-primary w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> กำลังตรวจสอบ...</>
          ) : (
            <><BsShieldCheck size={15} /> ยืนยันสลิป</>
          )}
        </button>

        {result && (
          <div className={[
            'flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border',
            result.type === 'success'
              ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/8 border-rose-500/20 text-rose-400',
          ].join(' ')}>
            {result.type === 'success'
              ? <BsCheckCircleFill size={15} className="shrink-0 mt-0.5" />
              : <BsExclamationCircleFill size={15} className="shrink-0 mt-0.5" />}
            <div>
              {result.text}
              {result.type === 'success' && (
                <Link href="/dashboard" className="ml-2 underline text-emerald-300 text-xs hover:text-emerald-200 inline-flex items-center gap-1">
                  ไปหน้าหลัก <BsArrowRight size={10} />
                </Link>
              )}
            </div>
          </div>
        )}
      </form>
    </main>
  );
}
