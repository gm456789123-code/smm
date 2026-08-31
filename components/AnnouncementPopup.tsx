'use client';

import { useEffect, useState } from 'react';
import { BsExclamationTriangleFill, BsX } from 'react-icons/bs';

const DISMISS_KEY = 'announcement_dismissed';

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog" aria-modal="true" aria-labelledby="announcement-title"
    >
      <div className="glass relative w-full max-w-md p-6 space-y-4">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-[#475569] hover:text-white transition-colors"
          aria-label="ปิด"
        >
          <BsX size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)' }}>
            <BsExclamationTriangleFill size={18} className="text-amber-400" />
          </div>
          <h2 id="announcement-title" className="text-white font-semibold text-base">
            แจ้งเตือนจากทีมงาน
          </h2>
        </div>

        <p className="text-[#C4B5FD] text-sm leading-relaxed whitespace-pre-line">{text}</p>

        <button onClick={dismiss} className="btn-primary w-full py-2.5 text-sm">
          รับทราบ
        </button>
      </div>
    </div>
  );
}
