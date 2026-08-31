'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BsShieldLockFill } from 'react-icons/bs';

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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-[2px] p-4"
      role="dialog" aria-modal="true" aria-labelledby="pdpa-title"
    >
      <div className="pg-stat relative w-full max-w-lg p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.92)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(109,59,175,0.12)', border: '1px solid rgba(109,59,175,0.30)' }}>
            <BsShieldLockFill size={18} className="text-[#6D3BAF]" />
          </div>
          <h2 id="pdpa-title" className="font-bold text-[#2D1B4E] text-base">
            นโยบายความเป็นส่วนตัว (PDPA)
          </h2>
        </div>

        <p className="text-[#4A3B63] text-sm leading-relaxed">
          เว็บไซต์นี้เก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่าน เช่น ชื่อบัญชี อีเมล และประวัติการทำรายการ
          เพื่อให้บริการและปรับปรุงประสบการณ์การใช้งาน ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA)
          อ่านรายละเอียดเพิ่มเติมได้ที่{' '}
          <Link href="/privacy" className="text-[#6D3BAF] font-semibold underline hover:text-[#2D1B4E]">
            นโยบายความเป็นส่วนตัว
          </Link>
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={accept} className="pg-btn-primary flex-1 justify-center py-3 text-sm">
            ยอมรับและดำเนินการต่อ
          </button>
          <Link
            href="/privacy"
            className="pg-btn-outline flex-1 justify-center py-3 text-sm"
          >
            อ่านนโยบายก่อน
          </Link>
        </div>
      </div>
    </div>
  );
}
