'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { BsShieldLockFill, BsX } from 'react-icons/bs';

const CONSENT_KEY = 'pdpa_consent';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener('pdpa-consent-change', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('pdpa-consent-change', onChange);
  };
}

function hasConsent() {
  try { return localStorage.getItem(CONSENT_KEY) === '1'; }
  catch { return false; }
}

function serverConsent() { return true; }

export default function PdpaConsent({ paused = false }: { paused?: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const accepted = useSyncExternalStore(subscribe, hasConsent, serverConsent);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, '1');
      window.dispatchEvent(new Event('pdpa-consent-change'));
    } catch {}
    setDismissed(true);
  }

  if (accepted || dismissed || paused) return null;

  return (
    <div
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl"
      role="dialog" aria-labelledby="pdpa-title"
    >
      <div className="glass relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5 rounded-2xl border border-[rgba(139,92,246,0.35)] shadow-2xl"
        style={{ background: 'rgba(13,18,34,0.96)', backdropFilter: 'blur(20px)' }}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 sm:hidden text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          aria-label="ปิด"
        >
          <BsX size={18} />
        </button>

        <div className="flex items-center gap-3 flex-1 pr-6 sm:pr-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.30)' }}>
            <BsShieldLockFill size={16} className="text-[#a78bfa]" />
          </div>
          <p id="pdpa-title" className="text-[#CBD5E1] text-xs sm:text-sm leading-relaxed">
            เว็บไซต์นี้ใช้คุกกี้และข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
            อ่านเพิ่มเติมได้ที่{' '}
            <Link href="/privacy" className="text-[#a78bfa] font-semibold underline hover:text-white">
              นโยบายความเป็นส่วนตัว
            </Link>{' '}
            และ{' '}
            <Link href="/refund" className="text-[#a78bfa] font-semibold underline hover:text-white">
              นโยบายการคืนเงิน
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white shadow-lg cursor-pointer transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}
          >
            ยอมรับทั้งหมด
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="hidden sm:inline-flex text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            aria-label="ปิด"
          >
            <BsX size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
