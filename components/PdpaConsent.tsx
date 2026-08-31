'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BsShieldLockFill, BsX } from 'react-icons/bs';

const CONSENT_KEY = 'pdpa_consent';

export default function PdpaConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) !== '1') setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, '1');
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl"
      role="dialog" aria-labelledby="pdpa-title"
    >
      <div className="pg-stat relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5"
        style={{ background: 'rgba(255,255,255,0.92)' }}>
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 sm:hidden text-[#8B7A9E] hover:text-[#2D1B4E] transition-colors"
          aria-label="ปิด"
        >
          <BsX size={18} />
        </button>

        <div className="flex items-center gap-3 flex-1 pr-6 sm:pr-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(109,59,175,0.12)', border: '1px solid rgba(109,59,175,0.30)' }}>
            <BsShieldLockFill size={16} className="text-[#6D3BAF]" />
          </div>
          <p id="pdpa-title" className="text-[#4A3B63] text-xs sm:text-sm leading-relaxed">
            เว็บไซต์นี้ใช้ข้อมูลส่วนบุคคลของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
            อ่านเพิ่มเติมได้ที่{' '}
            <Link href="/privacy" className="text-[#6D3BAF] font-semibold underline hover:text-[#2D1B4E]">
              นโยบายความเป็นส่วนตัว
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={accept} className="pg-btn-primary px-5 py-2 text-xs sm:text-sm whitespace-nowrap">
            ยอมรับ
          </button>
          <button
            onClick={() => setVisible(false)}
            className="hidden sm:inline-flex text-[#8B7A9E] hover:text-[#2D1B4E] transition-colors"
            aria-label="ปิด"
          >
            <BsX size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
