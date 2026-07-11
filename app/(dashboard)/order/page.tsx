'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Service } from '@/lib/smm-api';
import { useLocale } from '@/components/LocaleProvider';
import {
  BsFacebook, BsInstagram, BsTiktok, BsYoutube, BsTwitterX,
  BsTwitch, BsCart3, BsGrid, BsStars, BsTelegram, BsSpotify,
  BsDiscord, BsLinkedin, BsWhatsapp,
  BsCheckLg, BsCheckCircle, BsExclamationCircle, BsArrowRight, BsX,
} from 'react-icons/bs';

const has = (c: string, ...words: string[]) =>
  words.some(w => c.toLowerCase().includes(w.toLowerCase()));

const PLATFORMS = [
  { label: 'ทั้งหมด',   icon: <BsGrid />,      match: () => true },
  { label: 'Facebook',  icon: <BsFacebook />,   match: (c: string) => has(c, 'แอปฟ้า', 'facebook') },
  { label: 'Instagram', icon: <BsInstagram />,  match: (c: string) => has(c, 'แอปชมพู', 'instagram') },
  { label: 'TikTok',    icon: <BsTiktok />,     match: (c: string) => has(c, 'ติ๊กต็อก', 'tiktok') },
  { label: 'YouTube',   icon: <BsYoutube />,    match: (c: string) => has(c, 'youtube') },
  { label: 'Twitter/X', icon: <BsTwitterX />,   match: (c: string) => has(c, 'ทวิตเตอร์', 'twitter') },
  { label: 'Telegram',  icon: <BsTelegram />,   match: (c: string) => has(c, 'telegram') },
  { label: 'Spotify',   icon: <BsSpotify />,    match: (c: string) => has(c, 'spotify') },
  { label: 'Discord',   icon: <BsDiscord />,    match: (c: string) => has(c, 'discord') },
  { label: 'LinkedIn',  icon: <BsLinkedin />,   match: (c: string) => has(c, 'linkedin') },
  { label: 'WhatsApp',  icon: <BsWhatsapp />,   match: (c: string) => has(c, 'whatsapp') },
  { label: 'Twitch',    icon: <BsTwitch />,     match: (c: string) => has(c, 'twitch') },
  { label: 'Shopee',    icon: <BsCart3 />,      match: (c: string) => has(c, 'shopee', 'ช้อปปี้') },
  { label: 'อื่นๆ',     icon: <BsStars />,      match: (c: string) =>
      !has(c, 'แอปฟ้า','facebook','แอปชมพู','instagram','ติ๊กต็อก','tiktok',
              'youtube','ทวิตเตอร์','twitter','telegram','spotify','discord',
              'linkedin','whatsapp','twitch','shopee','ช้อปปี้')
  },
];

const PAGE_SIZE = 60;
const EXCHANGE_RATE = Number(process.env.NEXT_PUBLIC_SMM_EXCHANGE_RATE ?? 36);
const MARKUP        = Number(process.env.NEXT_PUBLIC_SMM_MARKUP ?? 1.3);

function calcCostThb(quantity: number, rateUsd: number) {
  return Math.ceil((quantity / 1000) * rateUsd * EXCHANGE_RATE * MARKUP * 100) / 100;
}

const TH_UI = {
  pageTitle:        'สั่งซื้อบริการ',
  pageSubtitle:     'เลือกบริการ → กรอกข้อมูล → สั่งซื้อ',
  balance:          'ยอดเงิน',
  topup:            'เติมเงิน',
  searchPlaceholder:'ค้นหาบริการ หรือ ID...',
  loading:          'กำลังโหลด...',
  loadingMore:      'กำลังโหลดเพิ่ม...',
  noService:        'ไม่พบบริการ',
  emptyTitle:       'เลือกบริการจากรายการด้านซ้าย',
  emptyHint:        'ใช้แท็บแพลตฟอร์มหรือค้นหาเพื่อกรอง',
  selectedLabel:    'บริการที่เลือก',
  price:            'ราคา',
  linkLabel:        'Link / URL เป้าหมาย',
  qtyLabel:         'จำนวน',
  estimatedPrice:   'ราคาโดยประมาณ',
  ordering:         'กำลังสั่ง...',
  order:            'สั่งซื้อ',
  viewOrders:       'ดูออเดอร์',
} as const;
type UIKey = keyof typeof TH_UI;

export default function OrderPage() {
  const { locale, translateBatch } = useLocale();

  const [services,  setServices]  = useState<Service[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [platform,  setPlatform]  = useState('ทั้งหมด');
  const [search,    setSearch]    = useState('');
  const [visible,   setVisible]   = useState(PAGE_SIZE);
  const [selected,  setSelected]  = useState<Service | null>(null);
  const [balance,   setBalance]   = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Order form
  const [link,       setLink]     = useState('');
  const [quantity,   setQty]      = useState('');
  const [submitting, setSubmit]   = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Drip-feed
  const [dripFeed, setDripFeed]   = useState(false);
  const [runs,     setRuns]       = useState('2');
  const [dripInterval, setDripInterval] = useState('60');

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Translation state
  const [trMap, setTrMap]     = useState<Map<string, string>>(new Map());
  const [trUI, setTrUI]       = useState<Record<UIKey, string>>({ ...TH_UI });
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/smm/services').then(r => r.json()).catch(() => []),
      fetch('/api/user/me').then(r => r.json()).catch(() => null),
    ]).then(([svcs, user]) => {
      setServices(Array.isArray(svcs) ? svcs : []);
      if (user && !user.error) setBalance(Number(user.balance));
      setLoading(false);
    });
  }, []);

  // Auto-translate when locale or services change
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

      const uiKeys = Object.keys(TH_UI) as UIKey[];
      const newUI = Object.fromEntries(
        uiKeys.map((k, i) => [k, translated[i]])
      ) as Record<UIKey, string>;

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

  const filtered = useMemo(() => {
    const p = PLATFORMS.find(p => p.label === platform) ?? PLATFORMS[0];
    return services.filter(s => {
      const okPlatform = p.match(s.category);
      const okSearch   = !search || s.name.toLowerCase().includes(search.toLowerCase())
        || String(s.service).includes(search);
      return okPlatform && okSearch;
    });
  }, [services, platform, search]);

  const displayed = filtered.slice(0, visible);
  const hasMore   = visible < filtered.length;

  useEffect(() => { setVisible(PAGE_SIZE); setSelected(null); setShowModal(false); }, [platform, search]);
  useEffect(() => { setQty(''); setMsg(null); setDripFeed(false); setRuns('2'); setDripInterval('60'); }, [selected]);

  const loadMore = useCallback(() => setVisible(v => v + PAGE_SIZE), []);
  useEffect(() => {
    if (!hasMore) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const qtyNum    = Number(quantity);
  const qtyMin    = Number(selected?.min ?? 0);
  const qtyMax    = Number(selected?.max ?? 0);
  const qtyValid  = selected ? Number.isFinite(qtyNum) && qtyNum >= qtyMin && qtyNum <= qtyMax : false;
  const costThb   = selected && quantity && qtyValid ? calcCostThb(qtyNum, Number(selected.rate)) : null;
  const canAfford = costThb !== null && balance !== null && balance >= costThb;
  const canSubmit = !!selected && !!link && !!quantity && qtyValid && !submitting;

  function pickService(svc: Service) {
    setSelected(svc);
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !selected) return;
    setSubmit(true);
    setMsg(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selected.service,
          provider: selected.provider,
          link,
          quantity: qtyNum,
          ...(dripFeed && { runs: Number(runs), interval: Number(dripInterval) }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error ?? (locale === 'zh' ? '发生错误' : 'Error occurred') });
      } else {
        setMsg({ type: 'success', text: `${locale === 'zh' ? '下单成功' : locale === 'en' ? 'Order placed' : 'สั่งซื้อสำเร็จ'}! #${data.orderId}` });
        setLink(''); setQty('');
        setBalance(Number(data.balance));
      }
    } catch {
      setMsg({ type: 'error', text: locale === 'zh' ? '发生错误 请重试' : locale === 'en' ? 'Error — please try again' : 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setSubmit(false);
    }
  }

  function OrderForm() {
    if (!selected) return null;
    return (
      <form onSubmit={placeOrder} className="flex flex-col gap-4">
        {/* Service info */}
        <div className="glass p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#475569] uppercase tracking-widest mb-1">{trUI.selectedLabel}</p>
              <p className="font-semibold text-white text-base leading-snug">{tr(selected.name)}</p>
              <p className="text-sm text-[#475569] mt-0.5">{tr(selected.category)}</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.12)] text-[#a78bfa] shrink-0">
              #{selected.service}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[#94A3B8] border-t border-[rgba(139,92,246,0.08)] pt-3">
            <span>{trUI.price}: <span className="text-[#06B6D4] font-mono">฿{Number(selected.rate).toFixed(4)}/1K</span></span>
            <span>Min–Max: <span className="text-white font-mono">{Number(selected.min).toLocaleString()} – {Number(selected.max).toLocaleString()}</span></span>
            <span>Refill: <span className={selected.refill ? 'text-emerald-400' : 'text-[#475569]'}>{selected.refill ? '✓' : '✗'}</span></span>
            <span>Cancel: <span className={selected.cancel ? 'text-emerald-400' : 'text-[#475569]'}>{selected.cancel ? '✓' : '✗'}</span></span>
          </div>
        </div>

        {/* Link */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#94A3B8]">{trUI.linkLabel}</label>
          <input
            type="url" value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://www.instagram.com/username"
            className="w-full glass px-4 py-3.5 text-base text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
            required
          />
        </div>

        {/* Quantity */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#94A3B8]">
            {trUI.qtyLabel}
            <span className="ml-2 text-[#475569] font-normal">
              ({Number(selected.min).toLocaleString()} – {Number(selected.max).toLocaleString()})
            </span>
          </label>
          <input
            type="number" value={quantity}
            onChange={e => setQty(e.target.value)}
            placeholder={String(selected.min)}
            min={selected.min} max={selected.max}
            className={[
              'w-full glass px-4 py-3.5 text-base text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border transition-colors',
              quantity && !qtyValid
                ? 'border-rose-500/50 focus:border-rose-500'
                : 'border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)]',
            ].join(' ')}
            required
          />
          {quantity && !qtyValid && (
            <p className="text-sm text-rose-400">
              {locale === 'zh'
                ? `数量必须在 ${Number(selected.min).toLocaleString()} – ${Number(selected.max).toLocaleString()} 之间`
                : locale === 'en'
                ? `Quantity must be between ${Number(selected.min).toLocaleString()} – ${Number(selected.max).toLocaleString()}`
                : `จำนวนต้องอยู่ระหว่าง ${Number(selected.min).toLocaleString()} – ${Number(selected.max).toLocaleString()}`}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-1">
            {[100, 500, 1000, 5000, 10000]
              .filter(v => v >= qtyMin && v <= qtyMax)
              .map(v => (
                <button key={v} type="button" onClick={() => setQty(String(v))}
                  className="glass-tab px-4 py-1.5 text-sm text-[#94A3B8] hover:text-white transition-colors">
                  {v.toLocaleString()}
                </button>
              ))}
          </div>
        </div>

        {/* Drip-feed */}
        <div className="glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#94A3B8]">Drip-feed</p>
              <p className="text-xs text-[#334155] mt-0.5">
                {locale === 'zh' ? '分批次投递，更自然' : locale === 'en' ? 'Deliver in multiple batches for organic growth' : 'แบ่งส่งหลายรอบ ดูเป็นธรรมชาติมากขึ้น'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDripFeed(v => !v)}
              className={[
                'relative w-11 h-6 rounded-full transition-colors shrink-0',
                dripFeed ? 'bg-[#8B5CF6]' : 'bg-[rgba(139,92,246,0.15)]',
              ].join(' ')}
              aria-pressed={dripFeed}
            >
              <span className={[
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                dripFeed ? 'translate-x-5' : 'translate-x-0.5',
              ].join(' ')} />
            </button>
          </div>
          {dripFeed && (
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[rgba(139,92,246,0.1)]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#475569]">
                  {locale === 'zh' ? '批次数量' : locale === 'en' ? 'Number of runs' : 'จำนวนรอบ'}
                  <span className="ml-1 text-[#334155]">(2–100)</span>
                </label>
                <input
                  type="number" value={runs} min={2} max={100}
                  onChange={e => setRuns(e.target.value)}
                  className="glass px-3 py-2 text-sm text-[#F1F5F9] bg-transparent outline-none rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[#475569]">
                  {locale === 'zh' ? '间隔（分钟）' : locale === 'en' ? 'Interval (minutes)' : 'ช่วงเวลา (นาที)'}
                  <span className="ml-1 text-[#334155]">(1–1440)</span>
                </label>
                <input
                  type="number" value={dripInterval} min={1} max={1440}
                  onChange={e => setDripInterval(e.target.value)}

                  className="glass px-3 py-2 text-sm text-[#F1F5F9] bg-transparent outline-none rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Price + Submit */}
        <div className="flex items-center justify-between pt-1 gap-4">
          <div>
            <p className="text-sm text-[#475569] mb-1">{trUI.estimatedPrice}</p>
            <p className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#06B6D4] text-glow-cyan">
              {costThb !== null ? `฿${costThb.toFixed(2)}` : '฿0.00'}
            </p>
            {costThb !== null && balance !== null && (
              <p className={`text-sm mt-0.5 ${canAfford ? 'text-emerald-500' : 'text-rose-400'}`}>
                {canAfford
                  ? locale === 'zh'
                    ? `余额 ฿${balance.toFixed(2)} — 足够`
                    : locale === 'en'
                    ? `Balance ฿${balance.toFixed(2)} — sufficient`
                    : `ยอดคงเหลือ ฿${balance.toFixed(2)} — เพียงพอ`
                  : locale === 'zh'
                    ? `余额不足 — 还需 ฿${(costThb - balance).toFixed(2)}`
                    : locale === 'en'
                    ? `Insufficient — need ฿${(costThb - balance).toFixed(2)} more`
                    : `ยอดไม่เพียงพอ — ต้องการอีก ฿${(costThb - balance).toFixed(2)}`}
              </p>
            )}
          </div>
          <button
            type="submit" disabled={!canSubmit}
            className="btn-primary flex items-center gap-2 px-8 py-4 text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting
              ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> {trUI.ordering}</>
              : <><BsCheckLg size={14} /> {trUI.order}</>}
          </button>
        </div>

        {/* Feedback */}
        {msg && (
          <div className={[
            'flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm border',
            msg.type === 'success'
              ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/8 border-rose-500/20 text-rose-400',
          ].join(' ')}>
            {msg.type === 'success'
              ? <BsCheckCircle size={15} className="shrink-0 mt-0.5" />
              : <BsExclamationCircle size={15} className="shrink-0 mt-0.5" />}
            <div>
              {msg.text}
              {msg.type === 'success' && (
                <Link href="/orders" className="ml-2 underline text-emerald-300 text-xs hover:text-emerald-200 inline-flex items-center gap-1">
                  {trUI.viewOrders} <BsArrowRight size={10} />
                </Link>
              )}
            </div>
          </div>
        )}
      </form>
    );
  }

  const ServiceList = (
    <div className="p-2 space-y-0.5">
      {displayed.map(svc => {
        const active = selected?.provider === svc.provider && selected?.service === svc.service;
        return (
          <button
            key={`${svc.provider}-${svc.service}`}
            onClick={() => pickService(svc)}
            className={[
              'w-full text-left px-3 py-3 rounded-xl transition-all flex items-start gap-3 group',
              active
                ? 'bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)]'
                : 'hover:bg-[rgba(139,92,246,0.06)] border border-transparent',
            ].join(' ')}
          >
            <span className="text-xs font-mono text-[#334155] w-12 shrink-0 pt-0.5">#{svc.service}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${active ? 'text-white' : 'text-white group-hover:text-white'}`}>
                {tr(svc.name)}
              </p>
              <p className="text-xs text-[#334155] truncate mt-0.5">{tr(svc.category)}</p>
            </div>
            <span className="text-xs font-mono text-[#06B6D4] shrink-0 whitespace-nowrap">
              ฿{Number(svc.rate).toFixed(3)}
            </span>
          </button>
        );
      })}
      <div ref={sentinelRef} className="h-4" />
      {hasMore && <p className="text-center text-xs text-[#334155] py-2 animate-pulse">{trUI.loadingMore}</p>}
    </div>
  );

  return (
    <main className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">{trUI.pageTitle}</h1>
            <p className="text-[#475569] text-sm mt-0.5">{trUI.pageSubtitle}</p>
          </div>
          {translating && (
            <span className="text-xs text-[#8B5CF6] animate-pulse">
              {locale === 'zh' ? '翻译中…' : 'Translating…'}
            </span>
          )}
        </div>
        <div className="glass px-4 py-2 flex items-center gap-2">
          <span className="text-xs text-[#475569] uppercase tracking-widest">{trUI.balance}</span>
          <span className="font-[family-name:var(--font-inter)] font-bold text-[#06B6D4] text-glow-cyan">
            {balance !== null ? `฿${balance.toFixed(2)}` : '...'}
          </span>
          <Link href="/topup" className="text-sm text-[#8B5CF6] hover:text-[#a78bfa] transition-colors ml-1">
            {trUI.topup} →
          </Link>
        </div>
      </div>

      {/* Platform tabs */}
      <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap">
        {PLATFORMS.map(p => (
          <button key={p.label} onClick={() => setPlatform(p.label)}
            className={[
              'glass-tab flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all w-full sm:w-auto sm:px-4 sm:whitespace-nowrap sm:shrink-0',
              p.label === 'ทั้งหมด' ? 'col-span-3 sm:col-span-1' : '',
              platform === p.label ? 'glass-tab-active text-white' : 'text-white',
            ].join(' ')}>
            <span className="text-lg leading-none shrink-0">{p.icon}</span>
            <span className="truncate">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Body — split on desktop */}
      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">

        {/* Service list panel */}
        <div className="glass flex flex-col lg:w-[720px] xl:w-[800px] shrink-0 overflow-hidden">
          <div className="p-3 border-b border-[rgba(139,92,246,0.10)]">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={trUI.searchPlaceholder}
              className="w-full glass px-4 py-3 text-base text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
          </div>
          <div className="px-4 py-2 border-b border-[rgba(139,92,246,0.06)]">
            <span className="text-xs text-[#334155] uppercase tracking-widest">
              {loading
                ? trUI.loading
                : `${filtered.length.toLocaleString()} ${locale === 'zh' ? '项服务' : locale === 'en' ? 'services' : 'บริการ'}`}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {loading ? (
              <div className="flex flex-col gap-2 p-3">
                {[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-[rgba(139,92,246,0.05)] animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-[#475569] text-sm">{trUI.noService}</div>
            ) : ServiceList}
          </div>
        </div>

        {/* Desktop: Order form (right panel) */}
        <div className="hidden lg:flex flex-1 flex-col gap-4 min-w-0">
          {!selected ? (
            <div className="glass flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(139,92,246,0.08)] flex items-center justify-center">
                <BsGrid size={24} className="text-[#475569]" />
              </div>
              <p className="text-[#475569] text-sm text-center">
                {trUI.emptyTitle}<br />
                <span className="text-[#334155] text-xs">{trUI.emptyHint}</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {OrderForm()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Bottom sheet popup */}
      {showModal && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl overflow-hidden"
            style={{ background: 'rgba(13,18,34,0.97)', borderTop: '1px solid rgba(139,92,246,0.2)', maxHeight: '88vh' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-[rgba(139,92,246,0.3)] mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <p className="text-sm font-semibold text-white truncate pr-8 mt-1">
                {selected ? tr(selected.name) : ''}
              </p>
              <button onClick={closeModal} className="text-[#475569] hover:text-white transition-colors p-1 shrink-0">
                <BsX size={22} />
              </button>
            </div>
            <div className="overflow-y-auto px-5 pb-8 pt-2" style={{ maxHeight: 'calc(88vh - 60px)' }}>
              {OrderForm()}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
