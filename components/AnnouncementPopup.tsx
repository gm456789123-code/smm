'use client';

import { useEffect, useState } from 'react';
import { BsMegaphoneFill, BsX, BsCheckCircleFill } from 'react-icons/bs';

const DISMISS_KEY = 'announcement_dismissed_v2';

export default function AnnouncementPopup() {
  const [text, setText]       = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/announcement')
      .then(r => r.json())
      .then((d: { text: string; active: string }) => {
        if (d.active === '1' && d.text && localStorage.getItem(DISMISS_KEY) !== d.text) {
          setText(d.text);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, text);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog" aria-modal="true" aria-labelledby="announcement-title"
    >
      <div className="glass relative w-full max-w-lg p-6 sm:p-7 space-y-5 rounded-2xl border border-[rgba(139,92,246,0.3)] shadow-2xl bg-[rgba(13,18,34,0.95)]">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 text-[#64748B] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="ปิด"
        >
          <BsX size={22} />
        </button>

        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.25))',
              border: '1px solid rgba(139,92,246,0.4)',
            }}
          >
            <BsMegaphoneFill size={22} className="text-[#A78BFA]" />
          </div>
          <div>
            <h2 id="announcement-title" className="text-white font-bold text-lg leading-tight">
              ประกาศจากทีมงาน
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">แจ้งเตือนระบบและบริการ</p>
          </div>
        </div>

        <div className="glass p-4 rounded-xl border border-[rgba(139,92,246,0.15)] bg-[rgba(255,255,255,0.02)]">
          <p className="text-[#E2E8F0] text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {text}
          </p>
        </div>

        <button
          onClick={dismiss}
          className="btn-primary w-full py-3.5 text-base font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <BsCheckCircleFill size={16} />
          ตกลง
        </button>
      </div>
    </div>
  );
}
