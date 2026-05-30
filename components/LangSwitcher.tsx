'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from './LocaleProvider';
import { BsGlobe2, BsCheck2 } from 'react-icons/bs';

export default function LangSwitcher() {
  const { locale, setLocale, locales, localeNames, localeFlags } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-transparent hover:border-[rgba(139,92,246,0.22)] hover:bg-[rgba(139,92,246,0.08)] transition-all"
        title="เปลี่ยนภาษา"
      >
        <BsGlobe2 size={14} className="text-[#8B5CF6]" />
        <span className="text-base leading-none">{localeFlags[locale]}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50"
          style={{ background: 'rgba(7,9,15,0.97)', border: '1px solid rgba(139,92,246,0.20)', backdropFilter: 'blur(24px)' }}>
          {/* Top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.5)] to-transparent" />
          <div className="p-1.5">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => { setLocale(l); setOpen(false); }}
                className={[
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                  l === locale
                    ? 'bg-[rgba(139,92,246,0.18)] text-white'
                    : 'text-[#94A3B8] hover:bg-[rgba(139,92,246,0.08)] hover:text-white',
                ].join(' ')}
              >
                <span className="text-base leading-none w-5">{localeFlags[l]}</span>
                <span className="flex-1 text-left">{localeNames[l]}</span>
                {l === locale && <BsCheck2 size={13} className="text-[#8B5CF6] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
