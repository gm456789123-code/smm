'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BsShieldLockFill, BsX, BsCheck2 } from 'react-icons/bs';

const CONSENT_KEY = 'pdpa_consent_v2';

export default function PdpaConsent() {
  const [mounted, setMounted] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      setHasAccepted(stored === '1');
    } catch {
      setHasAccepted(false);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, '1');
    } catch {}
    setHasAccepted(true);
    setDismissed(true);
  }

  function dismiss() {
    setDismissed(true);
  }

  // Before mount on client or if already accepted/dismissed, don't render
  if (!mounted || hasAccepted || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-labelledby="pdpa-title"
    >
      <div
        className="glass relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-[rgba(139,92,246,0.4)] shadow-2xl"
        style={{
          background: 'rgba(13,18,34,0.96)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(139,92,246,0.2)',
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 md:hidden text-[#94A3B8] hover:text-white transition-colors p-1 cursor-pointer"
          aria-label="ปิด"
        >
          <BsX size={20} />
        </button>

        <div className="flex items-start sm:items-center gap-3.5 flex-1 pr-6 md:pr-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0"
            style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.35)' }}
          >
            <BsShieldLockFill size={18} className="text-[#a78bfa]" />
          </div>
          <div className="space-y-1">
            <p className="text-white font-bold text-xs sm:text-sm flex items-center gap-2">
              <span>การคุ้มครองข้อมูลส่วนบุคคล (PDPA) & คุกกี้</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                เป็นไปตามกฎหมาย
              </span>
            </p>
            <p id="pdpa-title" className="text-[#CBD5E1] text-xs sm:text-sm leading-relaxed">
              เว็บไซต์นี้ใช้คุกกี้เพื่อมอบประสบการณ์การใช้งานที่ดีที่สุด และประมวลผลข้อมูลตาม{' '}
              <Link href="/privacy" className="text-[#a78bfa] font-semibold underline hover:text-white transition-colors">
                นโยบายความเป็นส่วนตัว
              </Link>{' '}
              และ{' '}
              <Link href="/refund" className="text-[#a78bfa] font-semibold underline hover:text-white transition-colors">
                นโยบายการคืนเงิน (Refund Policy)
              </Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={accept}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white shadow-lg cursor-pointer transition-all flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
          >
            <BsCheck2 size={16} />
            ยอมรับทั้งหมด
          </button>
          <button
            onClick={dismiss}
            className="hidden md:inline-flex text-[#94A3B8] hover:text-white transition-colors p-2 cursor-pointer"
            aria-label="ปิด"
          >
            <BsX size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
