'use client';

import { useState, useEffect, useMemo } from 'react';
import { Service } from '@/lib/smm-api';

const PLATFORMS = ['ทั้งหมด', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter', 'Telegram', 'Spotify'];

// Word-boundary regex — จับทั้งชื่อเต็มและชื่อย่อ (FB, IG, TG, YT, X, TT)
const PLATFORM_RE: Record<string, RegExp> = {
  Instagram: /instagram|\big\b/i,
  TikTok:    /tiktok|tik[\s-]?tok|\btt\b/i,
  YouTube:   /youtube|\byt\b/i,
  Facebook:  /facebook|\bfb\b/i,
  Twitter:   /twitter|\bx\b|tweet/i,
  Telegram:  /telegram|\btg\b/i,
  Spotify:   /spotify/i,
};

function matchPlatform(name: string, category: string, platform: string): boolean {
  if (platform === 'ทั้งหมด') return true;
  const text = `${name} ${category}`;
  return PLATFORM_RE[platform]?.test(text) ?? false;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [platform, setPlatform] = useState('ทั้งหมด');
  const [category, setCategory] = useState('ทั้งหมด');

  useEffect(() => {
    fetch('/api/smm/services')
      .then(r => r.json())
      .then((d: Service[]) => { setServices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Count per platform tab
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { 'ทั้งหมด': services.length };
    for (const p of PLATFORMS.slice(1)) {
      counts[p] = services.filter(s => matchPlatform(s.name, s.category, p)).length;
    }
    return counts;
  }, [services]);

  // Real categories from API
  const categories = useMemo(() => {
    const cats = [...new Set(services.map(s => s.category))].sort();
    return ['ทั้งหมด', ...cats];
  }, [services]);

  const filtered = useMemo(() => services.filter(s => {
    const okPlatform = matchPlatform(s.name, s.category, platform);
    const okCat      = category === 'ทั้งหมด' || s.category === category;
    const okSearch   = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return okPlatform && okCat && okSearch;
  }), [services, platform, category, search]);

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">บริการทั้งหมด</h1>
        <p className="text-[#475569] text-sm mt-0.5">{services.length} บริการ</p>
      </div>

      {/* Filters */}
      <div className="glass p-4 space-y-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPlatform('ทั้งหมด'); setCategory('ทั้งหมด'); }}
          placeholder="ค้นหาบริการ..."
          className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
        />

        {/* Platform tabs + count badge */}
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => {
            const count = platformCounts[p] ?? 0;
            const active = platform === p;
            return (
              <button
                key={p}
                onClick={() => { setPlatform(p); setCategory('ทั้งหมด'); }}
                className={[
                  'glass-tab flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all',
                  active ? 'glass-tab-active text-[#c4b5fd]' : count === 0 ? 'text-[#334155] opacity-50' : 'text-[#94A3B8]',
                ].join(' ')}
              >
                {p}
                {p !== 'ทั้งหมด' && (
                  <span className={`text-[9px] px-1 py-0.5 rounded ${active ? 'bg-[rgba(139,92,246,0.25)] text-[#c4b5fd]' : count === 0 ? 'bg-[rgba(71,85,105,0.15)] text-[#334155]' : 'bg-[rgba(139,92,246,0.10)] text-[#475569]'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category filter — real categories from API */}
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={['glass-tab-cyan glass-tab px-3 py-1 text-xs', category === c ? 'glass-tab-cyan-active text-[#67e8f9]' : 'text-[#94A3B8]'].join(' ')}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass p-4">
        {loading ? (
          <p className="py-10 text-center text-[#475569] animate-pulse">กำลังโหลดบริการ...</p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-[#475569] text-sm">
              {platform !== 'ทั้งหมด'
                ? `API ไม่มีบริการ ${platform} หรือใช้ชื่อหมวดหมู่ต่างออกไป`
                : 'ไม่พบบริการที่ตรงกัน'}
            </p>
            <p className="text-[#334155] text-xs">ลองเลือก "ทั้งหมด" หรือค้นหาด้วยคำอื่น</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <p className="text-[10px] text-[#334155] mb-3">แสดง {filtered.length} รายการ</p>
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
                {filtered.map(s => (
                  <tr key={s.service} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                    <td className="py-2.5 pr-3 font-mono text-xs text-[#475569]">{s.service}</td>
                    <td className="py-2.5 pr-3 text-[#F1F5F9] max-w-[280px]">
                      <p className="truncate">{s.name}</p>
                      <p className="text-[10px] text-[#475569]">{s.type}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-[#94A3B8]">{s.category}</td>
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
          </div>
        )}
      </div>
    </main>
  );
}
