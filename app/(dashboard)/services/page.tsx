'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Service } from '@/lib/smm-api';
import {
  BsFacebook, BsInstagram, BsTiktok, BsYoutube, BsTwitterX,
  BsTwitch, BsCart3, BsGrid, BsStars,
} from 'react-icons/bs';

interface Platform {
  label: string;
  icon: React.ReactNode;
  match: (cat: string) => boolean;
}

const PLATFORMS: Platform[] = [
  { label: 'ทั้งหมด',   icon: <BsGrid />,      match: () => true },
  { label: 'Facebook',  icon: <BsFacebook />,   match: c => c.includes('แอปฟ้า') },
  { label: 'Instagram', icon: <BsInstagram />,  match: c => c.includes('แอปชมพู') },
  { label: 'TikTok',    icon: <BsTiktok />,     match: c => c.includes('ติ๊กต็อก') },
  { label: 'YouTube',   icon: <BsYoutube />,    match: c => c.includes('Youtube') || c.includes('YouTube') },
  { label: 'Twitter/X', icon: <BsTwitterX />,   match: c => c.includes('ทวิตเตอร์') || c.includes('Twitter') },
  { label: 'Twitch',    icon: <BsTwitch />,     match: c => c.includes('Twitch') },
  { label: 'Shopee',    icon: <BsCart3 />,      match: c => c.includes('Shopee') || c.includes('ช้อปปี้') },
  { label: 'อื่นๆ',     icon: <BsStars />,      match: c =>
      !c.includes('แอปฟ้า') && !c.includes('แอปชมพู') && !c.includes('ติ๊กต็อก') &&
      !c.includes('Youtube') && !c.includes('YouTube') && !c.includes('ทวิตเตอร์') &&
      !c.includes('Twitter') && !c.includes('Twitch') && !c.includes('Shopee') && !c.includes('ช้อปปี้')
  },
];

const PAGE_SIZE = 50;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [platform, setPlatform] = useState('ทั้งหมด');
  const [visible,  setVisible]  = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/smm/services')
      .then(r => r.json())
      .then((d: Service[]) => { setServices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of PLATFORMS) {
      counts[p.label] = services.filter(s => p.match(s.category)).length;
    }
    return counts;
  }, [services]);

  const filtered = useMemo(() => {
    const p = PLATFORMS.find(p => p.label === platform) ?? PLATFORMS[0];
    return services.filter(s => {
      const okPlatform = p.match(s.category);
      const okSearch   = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
      return okPlatform && okSearch;
    });
  }, [services, platform, search]);

  const displayed = filtered.slice(0, visible);
  const hasMore   = visible < filtered.length;

  // Reset visible count when filter/search changes
  useEffect(() => { setVisible(PAGE_SIZE); }, [platform, search]);

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    setVisible(v => Math.min(v + PAGE_SIZE, filtered.length));
  }, [filtered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">บริการทั้งหมด</h1>
        <p className="text-[#475569] text-sm mt-0.5">{services.length} บริการ</p>
      </div>

      <div className="glass p-4 space-y-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPlatform('ทั้งหมด'); }}
          placeholder="ค้นหาบริการ..."
          className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
        />

        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => {
            const count  = platformCounts[p.label] ?? 0;
            const active = platform === p.label;
            return (
              <button
                key={p.label}
                onClick={() => setPlatform(p.label)}
                className={[
                  'glass-tab flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all',
                  active
                    ? 'glass-tab-active text-[#c4b5fd]'
                    : count === 0
                      ? 'text-[#334155] opacity-40 cursor-default'
                      : 'text-[#94A3B8] hover:text-white',
                ].join(' ')}
                disabled={count === 0 && p.label !== 'ทั้งหมด'}
              >
                <span className="text-sm">{p.icon}</span>
                {p.label}
                <span className={`text-[9px] px-1 py-0.5 rounded ${active ? 'bg-[rgba(139,92,246,0.25)] text-[#c4b5fd]' : 'bg-[rgba(139,92,246,0.10)] text-[#475569]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass p-4">
        {loading ? (
          <p className="py-10 text-center text-[#475569] animate-pulse">กำลังโหลดบริการ...</p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-[#475569] text-sm">ไม่พบบริการที่ตรงกัน</p>
            <p className="text-[#334155] text-xs">ลองเลือก "ทั้งหมด" หรือค้นหาด้วยคำอื่น</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <p className="text-[10px] text-[#334155] mb-3">
              แสดง {displayed.length} จาก {filtered.length} รายการ
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                  <th className="pb-3 pr-3">ID</th>
                  <th className="pb-3 pr-3">ชื่อบริการ</th>
                  <th className="pb-3 pr-3">หมวดหมู่</th>
                  <th className="pb-3 pr-3">ราคา/1K</th>
                  <th className="pb-3 pr-3">Min</th>
                  <th className="pb-3 pr-3">Max</th>
                  <th className="pb-3">Refill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
                {displayed.map(s => (
                  <tr key={`${s.provider}-${s.service}`} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                    <td className="py-2.5 pr-3 font-mono text-xs text-[#475569]">{s.service}</td>
                    <td className="py-2.5 pr-3 text-[#F1F5F9] max-w-[280px]">
                      <p className="truncate">{s.name}</p>
                      <p className="text-[10px] text-[#475569]">{s.type}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-[#94A3B8] max-w-[160px]">
                      <p className="truncate">{s.category}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-[#06B6D4] font-mono font-semibold">${s.rate}</td>
                    <td className="py-2.5 pr-3 text-xs text-[#94A3B8]">{Number(s.min).toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-xs text-[#94A3B8]">{Number(s.max).toLocaleString()}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.refill ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[rgba(71,85,105,0.2)] text-[#475569]'}`}>
                        {s.refill ? '✓' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4" />
            {hasMore && (
              <p className="text-center text-[10px] text-[#334155] py-2 animate-pulse">กำลังโหลดเพิ่ม...</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
