'use client';

import { useEffect, useState } from 'react';
import { BsMegaphone, BsX } from 'react-icons/bs';

export default function AnnouncementBanner() {
  const [text, setText]       = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/announcement')
      .then(r => r.json())
      .then((d: { text: string; active: string }) => {
        if (d.active === '1' && d.text) {
          setText(d.text);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!visible) return null;

  return (
    <div className="w-full px-4 pt-3">
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm border"
        style={{ background: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.25)' }}>
        <BsMegaphone size={15} className="text-[#8B5CF6] shrink-0 mt-0.5" />
        <p className="flex-1 text-[#C4B5FD] leading-relaxed">{text}</p>
        <button
          onClick={() => setVisible(false)}
          className="text-[#475569] hover:text-white transition-colors shrink-0"
          aria-label="ปิด"
        >
          <BsX size={18} />
        </button>
      </div>
    </div>
  );
}
