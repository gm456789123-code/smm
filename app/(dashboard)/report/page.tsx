'use client';

import { useState } from 'react';
import { BsCheckCircle, BsExclamationTriangle, BsChatSquareDots } from 'react-icons/bs';

const CATEGORIES = [
  'ออเดอร์ไม่ทำงาน / ค้าง',
  'ถูกหักเงินแต่ไม่ได้รับบริการ',
  'เติมเงินแล้วยอดไม่เข้า',
  'บริการผิดพลาด / จำนวนไม่ครบ',
  'ปัญหาเข้าสู่ระบบ',
  'อื่นๆ',
];

export default function ReportPage() {
  const [category, setCategory] = useState('');
  const [orderId,  setOrderId]  = useState('');
  const [detail,   setDetail]   = useState('');
  const [sending,  setSending]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !detail.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, orderId: orderId.trim(), detail: detail.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      } else {
        setDone(true);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <main className="flex-1 p-6 flex items-center justify-center">
        <div className="glass border-t-2 border-t-emerald-400/60 p-10 max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
            <BsCheckCircle size={28} className="text-emerald-400" />
          </div>
          <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">ส่งคำร้องแล้ว</h2>
          <p className="text-[#94A3B8] text-sm">ทีมงานจะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง</p>
          <button
            onClick={() => { setDone(false); setCategory(''); setOrderId(''); setDetail(''); }}
            className="glass-tab glass-tab-active px-6 py-2.5 text-sm font-semibold text-[#c4b5fd] mt-2"
          >
            แจ้งปัญหาใหม่
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
          <BsChatSquareDots size={20} className="text-[#a78bfa]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">แจ้งปัญหา</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">กรอกรายละเอียดเพื่อให้ทีมงานช่วยเหลือ</p>
        </div>
      </div>

      <form onSubmit={submit} className="glass border-t-2 border-t-[#8B5CF6]/60 p-6 space-y-5">

        {/* Category */}
        <div className="space-y-2">
          <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ประเภทปัญหา</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c} type="button"
                onClick={() => setCategory(c)}
                className={[
                  'text-left px-4 py-3 rounded-xl text-sm border transition-all',
                  category === c
                    ? 'bg-[rgba(139,92,246,0.15)] border-[rgba(139,92,246,0.50)] text-[#c4b5fd]'
                    : 'glass-tab text-[#94A3B8] hover:text-white',
                ].join(' ')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Order ID */}
        <div className="space-y-2">
          <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">
            Order ID <span className="normal-case font-normal text-[#94A3B8]">(ถ้ามี)</span>
          </label>
          <input
            type="text" value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="เช่น 10234"
            className="w-full glass px-4 py-3 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(255,255,255,0.10)] focus:border-[rgba(139,92,246,0.50)] transition-colors"
          />
        </div>

        {/* Detail */}
        <div className="space-y-2">
          <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">รายละเอียด</label>
          <textarea
            value={detail}
            onChange={e => setDetail(e.target.value)}
            placeholder="อธิบายปัญหาที่พบ เช่น ออเดอร์ #12345 สั่งไปแล้ว 3 ชั่วโมงยังไม่เริ่ม..."
            rows={5}
            className="w-full glass px-4 py-3 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(255,255,255,0.10)] focus:border-[rgba(139,92,246,0.50)] transition-colors resize-none"
            required
          />
          <p className={`text-[11px] text-right ${detail.length > 800 ? 'text-rose-400' : 'text-[#64748B]'}`}>
            {detail.length} / 800
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm">
            <BsExclamationTriangle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!category || !detail.trim() || sending || detail.length > 800}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          {sending
            ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> กำลังส่ง...</>
            : 'ส่งคำร้อง'}
        </button>
      </form>
    </main>
  );
}
