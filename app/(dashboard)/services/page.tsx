'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Service } from '@/lib/smm-api';
import { useLocale } from '@/components/LocaleProvider';
import {
  BsFacebook, BsInstagram, BsTiktok, BsYoutube, BsTwitterX,
  BsTwitch, BsCart3, BsGrid, BsStars, BsTelegram, BsSpotify,
  BsDiscord, BsLinkedin, BsWhatsapp,
} from 'react-icons/bs';

interface Platform {
  label: string;
  icon: React.ReactNode;
  match: (cat: string) => boolean;
}

const has = (c: string, ...words: string[]) => words.some(w => c.toLowerCase().includes(w.toLowerCase()));

const PLATFORMS: Platform[] = [
  { label: 'ทั้งหมด',   icon: <BsGrid />,      match: () => true },
  { label: 'Facebook',  icon: <BsFacebook />,   match: c => has(c, 'แอปฟ้า', 'facebook') },
  { label: 'Instagram', icon: <BsInstagram />,  match: c => has(c, 'แอปชมพู', 'instagram') },
  { label: 'TikTok',    icon: <BsTiktok />,     match: c => has(c, 'ติ๊กต็อก', 'tiktok') },
  { label: 'YouTube',   icon: <BsYoutube />,    match: c => has(c, 'youtube') },
  { label: 'Twitter/X', icon: <BsTwitterX />,   match: c => has(c, 'ทวิตเตอร์', 'twitter') },
  { label: 'Telegram',  icon: <BsTelegram />,   match: c => has(c, 'telegram') },
  { label: 'Spotify',   icon: <BsSpotify />,    match: c => has(c, 'spotify') },
  { label: 'Discord',   icon: <BsDiscord />,    match: c => has(c, 'discord') },
  { label: 'LinkedIn',  icon: <BsLinkedin />,   match: c => has(c, 'linkedin') },
  { label: 'WhatsApp',  icon: <BsWhatsapp />,   match: c => has(c, 'whatsapp') },
  { label: 'Twitch',    icon: <BsTwitch />,     match: c => has(c, 'twitch') },
  { label: 'Shopee',    icon: <BsCart3 />,      match: c => has(c, 'shopee', 'ช้อปปี้') },
  { label: 'อื่นๆ',     icon: <BsStars />,      match: c =>
      !has(c, 'แอปฟ้า','facebook','แอปชมพู','instagram','ติ๊กต็อก','tiktok',
              'youtube','ทวิตเตอร์','twitter','telegram','spotify','discord',
              'linkedin','whatsapp','twitch','shopee','ช้อปปี้')
  },
];

const PAGE_SIZE = 50;

// UI labels keyed in Thai — translateBatch will convert these when locale ≠ th
const TH_UI = {
  title: 'บริการทั้งหมด',
  search: 'ค้นหาบริการ...',
  loading: 'กำลังโหลดบริการ...',
  noResults: 'ไม่พบบริการที่ตรงกัน',
  noResultsHint: 'ลองเลือก "ทั้งหมด" หรือค้นหาด้วยคำอื่น',
  loadingMore: 'กำลังโหลดเพิ่ม...',
} as const;
type UIKey = keyof typeof TH_UI;

export default function ServicesPage() {
  const { locale, translateBatch } = useLocale();

  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [platform, setPlatform] = useState('ทั้งหมด');
  const [visible,  setVisible]  = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Lookup maps for translated text
  const [trMap, setTrMap]     = useState<Map<string, string>>(new Map());
  const [trUI, setTrUI]       = useState<Record<UIKey, string>>({ ...TH_UI });
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    fetch('/api/smm/services')
      .then(r => r.json())
      .then((d: Service[]) => { setServices(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Auto-translate service names/categories + UI strings when locale or services change
  useEffect(() => {
    let cancelled = false;

    if (locale === 'th') {
      setTrMap(new Map());
      setTrUI({ ...TH_UI });
      return;
    }

    if (services.length === 0) return;

    setTranslating(true);

    const uniqueContent = [...new Set(services.flatMap(s => [s.name, s.category]))];
    const uiValues = Object.values(TH_UI) as string[];
    const allTexts = [...uiValues, ...uniqueContent];

    translateBatch(allTexts).then(translated => {
      if (cancelled) return;

      // UI strings come first
      const uiKeys = Object.keys(TH_UI) as UIKey[];
      const newUI = Object.fromEntries(
        uiKeys.map((k, i) => [k, translated[i]])
      ) as Record<UIKey, string>;

      // Content map
      const offset = uiValues.length;
      const newMap = new Map<string, string>(
        uniqueContent.map((text, i) => [text, translated[offset + i]])
      );

      setTrUI(newUI);
      setTrMap(newMap);
      setTranslating(false);
    }).catch(() => {
      if (!cancelled) setTranslating(false);
    });

    return () => { cancelled = true; };
  }, [locale, services, translateBatch]);

  const tr = (text: string) => trMap.get(text) ?? text;

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

  useEffect(() => { setVisible(PAGE_SIZE); }, [platform, search]);

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
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">
            {trUI.title}
          </h1>
          <p className="text-[#475569] text-sm mt-0.5">
            {services.length} {locale === 'th' ? 'บริการ' : locale === 'zh' ? '项服务' : 'services'}
          </p>
        </div>
        {translating && (
          <span className="text-xs text-[#8B5CF6] animate-pulse ml-auto">
            {locale === 'zh' ? '正在翻译…' : 'Translating…'}
          </span>
        )}
      </div>

      <div className="glass p-4 space-y-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPlatform('ทั้งหมด'); }}
          placeholder={trUI.search}
          className="glass w-full px-4 py-3 text-base text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
        />

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {PLATFORMS.map(p => {
            const count  = platformCounts[p.label] ?? 0;
            const active = platform === p.label;
            return (
              <button
                key={p.label}
                onClick={() => setPlatform(p.label)}
                className={[
                  'glass-tab flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all w-full sm:w-auto sm:px-4',
                  p.label === 'ทั้งหมด' ? 'col-span-2 sm:col-span-1' : '',
                  active
                    ? 'glass-tab-active text-white'
                    : count === 0
                      ? 'text-white/30 opacity-40 cursor-default'
                      : 'text-white hover:text-white',
                ].join(' ')}
                disabled={count === 0 && p.label !== 'ทั้งหมด'}
              >
                <span className="text-lg leading-none shrink-0">{p.icon}</span>
                <span className="truncate">{p.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ml-auto shrink-0 sm:ml-0 ${active ? 'bg-[rgba(139,92,246,0.30)] text-white' : 'bg-[rgba(255,255,255,0.10)] text-white/60'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass p-4">
        {loading ? (
          <p className="py-10 text-center text-[#475569] animate-pulse">{trUI.loading}</p>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-[#475569] text-sm">{trUI.noResults}</p>
            <p className="text-[#334155] text-xs">{trUI.noResultsHint}</p>
          </div>
        ) : (
          <>
            {/* ── Mobile cards ── */}
            <div className="sm:hidden divide-y divide-[rgba(139,92,246,0.07)]">
              {displayed.map(s => (
                <div key={`${s.provider}-${s.service}`} className="py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium leading-snug">{tr(s.name)}</p>
                      <p className="text-[#475569] text-xs mt-0.5">{tr(s.category)}</p>
                    </div>
                    <span className="text-[#06B6D4] font-mono font-bold text-sm shrink-0">฿{s.rate}<span className="text-[#475569] font-normal text-xs">/1K</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#475569]">
                    <span className="font-mono text-[#334155]">#{s.service}</span>
                    <span>Min <span className="text-[#94A3B8]">{Number(s.min).toLocaleString()}</span></span>
                    <span>Max <span className="text-[#94A3B8]">{Number(s.max).toLocaleString()}</span></span>
                    {s.refill && <span className="text-emerald-400">Refill ✓</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                    <th className="pb-3 pr-4">ID</th>
                    <th className="pb-3 pr-4">
                      {locale === 'en' ? 'Service' : locale === 'zh' ? '服务名称' : 'ชื่อบริการ'}
                    </th>
                    <th className="pb-3 pr-4">
                      {locale === 'en' ? 'Category' : locale === 'zh' ? '类别' : 'หมวดหมู่'}
                    </th>
                    <th className="pb-3 pr-4">
                      {locale === 'en' ? 'Rate/1K' : locale === 'zh' ? '价格/千' : 'ราคา/1K'}
                    </th>
                    <th className="pb-3 pr-4">Min</th>
                    <th className="pb-3 pr-4">Max</th>
                    <th className="pb-3">Refill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
                  {displayed.map(s => (
                    <tr key={`${s.provider}-${s.service}`} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                      <td className="py-3 pr-4 font-mono text-sm text-[#475569]">{s.service}</td>
                      <td className="py-3 pr-4 text-[#F1F5F9] max-w-[300px]">
                        <p className="truncate text-sm">{tr(s.name)}</p>
                        <p className="text-xs text-[#475569] mt-0.5">{s.type}</p>
                      </td>
                      <td className="py-3 pr-4 text-sm text-[#94A3B8] max-w-[180px]">
                        <p className="truncate">{tr(s.category)}</p>
                      </td>
                      <td className="py-3 pr-4 text-[#06B6D4] font-mono font-semibold text-sm">฿{s.rate}</td>
                      <td className="py-3 pr-4 text-sm text-[#94A3B8]">{Number(s.min).toLocaleString()}</td>
                      <td className="py-3 pr-4 text-sm text-[#94A3B8]">{Number(s.max).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${s.refill ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[rgba(71,85,105,0.2)] text-[#475569]'}`}>
                          {s.refill ? '✓' : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div ref={sentinelRef} className="h-4" />
            {hasMore && (
              <p className="text-center text-sm text-[#334155] py-2 animate-pulse">{trUI.loadingMore}</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
