'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BsMegaphoneFill, BsX, BsCheckCircleFill } from 'react-icons/bs';

const DISMISSED_KEY = 'announcement_dismissed_text';

export default function AnnouncementPopup({ onVisibilityChange }: { onVisibilityChange: (visible: boolean) => void }) {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    async function load() {
      let shouldShow = false;
      try {
        // Keep the policy pages readable even while an announcement is active.
        if (pathname === '/privacy' || pathname === '/terms') return;
        const response = await fetch('/api/announcement', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object') return;
        const { active, text: message } = data as Record<string, unknown>;
        if (active !== '1' || typeof message !== 'string' || !message.trim()) return;
        try {
          if (sessionStorage.getItem(DISMISSED_KEY) === message) return;
        } catch { /* The announcement remains usable when storage is blocked. */ }
        if (!cancelled) {
          setText(message);
          shouldShow = true;
        }
      } catch { /* A failed request must not display an outdated announcement. */ }
      finally {
        window.clearTimeout(timeout);
        if (!cancelled) {
          setVisible(shouldShow);
          onVisibilityChange(shouldShow);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [pathname, onVisibilityChange]);

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [visible]);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISSED_KEY, text);
    } catch { /* Closing must work without browser storage. */ }
    setVisible(false);
    onVisibilityChange(false);
  }

  if (!visible) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      className="fixed inset-0 m-0 h-dvh w-screen max-h-none max-w-none border-0 open:flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      aria-labelledby="announcement-title"
    >
      <div className="glass relative w-full max-w-lg max-h-full overflow-y-auto p-6 sm:p-7 space-y-5 rounded-2xl border border-[rgba(139,92,246,0.35)] shadow-2xl bg-[rgba(13,18,34,0.98)]">
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
    </dialog>
  );
}
