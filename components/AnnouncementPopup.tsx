'use client';

import { useEffect, useState } from 'react';
import { BsMegaphoneFill, BsX, BsCheckCircleFill } from 'react-icons/bs';

export default function AnnouncementPopup() {
  const [text, setText] = useState(`เนื่องจากมีบริการที่ใช้งานไม่ได้ก่อนหน้านี้ทีมงานจึงได้ทำการนำบริการดังกล่าวออกและคืนเครดิตรให้กับ user เป็นที่เรียบร้อยแล้วค่ะ\nลูกค้าสามารถกดสั่งซื้อบริการได้ใหม่คะ`);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissedSession = sessionStorage.getItem('announcement_closed_session');
    if (dismissedSession === 'true') {
      return;
    }

    fetch('/api/announcement')
      .then(r => r.json())
      .then((d: { text: string; active: string }) => {
        if (d.active !== '0') {
          if (d.text) setText(d.text);
          setVisible(true);
        }
      })
      .catch(() => {
        setVisible(true);
      });
  }, []);

  function dismiss() {
    sessionStorage.setItem('announcement_closed_session', 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog" aria-modal="true" aria-labelledby="announcement-title"
    >
      <div className="glass relative w-full max-w-lg p-6 sm:p-7 space-y-5 rounded-2xl border border-[rgba(139,92,246,0.35)] shadow-2xl bg-[rgba(13,18,34,0.98)]">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          aria-label="ปิด"
        >
          <BsX size={24} />
        </button>

        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(6,182,212,0.35))',
              border: '1px solid rgba(139,92,246,0.5)',
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

        <div className="glass p-4 sm:p-5 rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(255,255,255,0.03)]">
          <p className="text-[#F1F5F9] text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium">
            {text}
          </p>
        </div>

        <button
          onClick={dismiss}
          className="btn-primary w-full py-3.5 text-base font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 cursor-pointer"
        >
          <BsCheckCircleFill size={18} />
          ตกลง
        </button>
      </div>
    </div>
  );
}
