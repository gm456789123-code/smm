'use client';

import { useState, useEffect, useMemo } from 'react';
import { Service } from '@/lib/smm-api';

const PLATFORMS = ['ทั้งหมด','Instagram','TikTok','YouTube','Facebook','Twitter','Telegram','Spotify'];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [platform, setPlatform] = useState('ทั้งหมด');
  const [category, setCategory] = useState('ทั้งหมด');

  useEffect(() => {
    fetch('/api/smm/services').then(r => r.json()).then((d: Service[]) => {
      setServices(Array.isArray(d) ? d : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(services.map(s => s.category))];
    return ['ทั้งหมด', ...cats];
  }, [services]);

  const filtered = useMemo(() => services.filter(s => {
    const matchPlatform = platform === 'ทั้งหมด' || s.name.toLowerCase().includes(platform.toLowerCase()) || s.category.toLowerCase().includes(platform.toLowerCase());
    const matchCat      = category === 'ทั้งหมด' || s.category === category;
    const matchSearch   = !search || s.name.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchCat && matchSearch;
  }), [services, platform, category, search]);

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">บริการทั้งหมด</h1>
        <p className="text-[#475569] text-sm mt-0.5">{services.length} บริการ</p>
      </div>

      {/* Filters */}
      <div className="glass p-4 space-y-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาบริการ..."
          className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={['glass-tab px-3 py-1.5 text-xs font-medium', platform===p ? 'glass-tab-active text-[#c4b5fd]' : 'text-[#94A3B8]'].join(' ')}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0,8).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={['glass-tab-cyan glass-tab px-3 py-1.5 text-xs', category===c ? 'glass-tab-cyan-active text-[#67e8f9]' : 'text-[#94A3B8]'].join(' ')}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass p-4">
        {loading ? (
          <p className="py-10 text-center text-[#475569] animate-pulse">กำลังโหลดบริการ...</p>
        ) : (
          <div className="overflow-x-auto">
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
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-[#475569]">ไม่พบบริการ</td></tr>
                ) : filtered.map(s => (
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
