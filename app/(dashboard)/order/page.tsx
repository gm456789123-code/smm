'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Service } from '@/lib/smm-api';
import {
  BsFacebook, BsInstagram, BsTiktok, BsYoutube, BsTwitterX,
  BsTwitch, BsCart3, BsGrid, BsStars, BsTelegram, BsSpotify,
  BsDiscord, BsLinkedin, BsWhatsapp,
  BsCheckLg, BsCheckCircle, BsExclamationCircle, BsArrowRight,
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

export default function OrderPage() {
  const [services,  setServices]  = useState<Service[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [platform,  setPlatform]  = useState('ทั้งหมด');
  const [search,    setSearch]    = useState('');
  const [visible,   setVisible]   = useState(PAGE_SIZE);
  const [selected,  setSelected]  = useState<Service | null>(null);
  const [balance,   setBalance]   = useState<number | null>(null);

  // Order form
  const [link,      setLink]      = useState('');
  const [quantity,  setQuantity]  = useState('');
  const [submitting, setSubmit]   = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const listRef     = useRef<HTMLDivElement>(null);

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

  useEffect(() => { setVisible(PAGE_SIZE); setSelected(null); }, [platform, search]);
  useEffect(() => { setQuantity(''); setMsg(null); }, [selected]);

  const loadMore = useCallback(() => setVisible(v => v + PAGE_SIZE), []);

  useEffect(() => {
    if (!hasMore) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadMore]);

  const qtyNum   = Number(quantity);
  const qtyMin   = Number(selected?.min ?? 0);
  const qtyMax   = Number(selected?.max ?? 0);
  const qtyValid = selected ? Number.isFinite(qtyNum) && qtyNum >= qtyMin && qtyNum <= qtyMax : false;
  const costThb  = selected && quantity && qtyValid
    ? calcCostThb(qtyNum, Number(selected.rate)) : null;
  const canAfford = costThb !== null && balance !== null && balance >= costThb;
  const canSubmit = !!selected && !!link && !!quantity && qtyValid && !submitting;

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
          provider:  selected.provider,
          link,
          quantity:  qtyNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' });
      } else {
        setMsg({ type: 'success', text: `สั่งซื้อสำเร็จ! Order #${data.orderId}` });
        setLink(''); setQuantity('');
        setBalance(Number(data.balance));
      }
    } catch {
      setMsg({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setSubmit(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">สั่งซื้อบริการ</h1>
          <p className="text-[#475569] text-sm mt-0.5">เลือกบริการ → กรอกข้อมูล → สั่งซื้อ</p>
        </div>
        <div className="glass px-4 py-2 flex items-center gap-2">
          <span className="text-[10px] text-[#475569] uppercase tracking-widest">ยอดเงิน</span>
          <span className="font-[family-name:var(--font-inter)] font-bold text-[#06B6D4] text-glow-cyan">
            {balance !== null ? `฿${balance.toFixed(2)}` : '...'}
          </span>
          <Link href="/topup" className="text-[10px] text-[#8B5CF6] hover:text-[#a78bfa] transition-colors ml-1">
            เติมเงิน →
          </Link>
        </div>
      </div>

      {/* Platform tabs — horizontal scroll */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {PLATFORMS.map(p => (
          <button
            key={p.label}
            onClick={() => setPlatform(p.label)}
            className={[
              'glass-tab flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-all',
              platform === p.label ? 'glass-tab-active text-[#c4b5fd]' : 'text-[#94A3B8]',
            ].join(' ')}
          >
            <span className="text-base leading-none">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex gap-4 flex-1 min-h-0 flex-col lg:flex-row">

        {/* Left: Service list */}
        <div className="glass flex flex-col lg:w-[420px] xl:w-[480px] shrink-0 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-[rgba(139,92,246,0.10)]">
            <input
              type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาบริการ หรือ ID..."
              className="w-full glass px-3 py-2 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
            />
          </div>

          {/* Count */}
          <div className="px-4 py-2 border-b border-[rgba(139,92,246,0.06)]">
            <span className="text-[10px] text-[#334155] uppercase tracking-widest">
              {loading ? 'กำลังโหลด...' : `${filtered.length.toLocaleString()} บริการ`}
            </span>
          </div>

          {/* List */}
          <div ref={listRef} className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {loading ? (
              <div className="flex flex-col gap-2 p-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-[rgba(139,92,246,0.05)] animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-[#475569] text-sm">ไม่พบบริการ</div>
            ) : (
              <div className="p-2 space-y-0.5">
                {displayed.map(svc => {
                  const active = selected?.provider === svc.provider && selected?.service === svc.service;
                  return (
                    <button
                      key={`${svc.provider}-${svc.service}`}
                      onClick={() => setSelected(svc)}
                      className={[
                        'w-full text-left px-3 py-3 rounded-xl transition-all flex items-start gap-3 group',
                        active
                          ? 'bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)]'
                          : 'hover:bg-[rgba(139,92,246,0.06)] border border-transparent',
                      ].join(' ')}
                    >
                      <span className="text-[10px] font-mono text-[#334155] mt-0.5 w-10 shrink-0 pt-0.5">
                        #{svc.service}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${active ? 'text-[#c4b5fd]' : 'text-[#CBD5E1] group-hover:text-white'}`}>
                          {svc.name}
                        </p>
                        <p className="text-[10px] text-[#334155] truncate mt-0.5">{svc.category}</p>
                      </div>
                      <span className="text-[10px] font-mono text-[#06B6D4] shrink-0 mt-0.5 whitespace-nowrap">
                        ${Number(svc.rate).toFixed(3)}
                      </span>
                    </button>
                  );
                })}
                <div ref={sentinelRef} className="h-4" />
                {hasMore && (
                  <p className="text-center text-[10px] text-[#334155] py-2 animate-pulse">กำลังโหลดเพิ่ม...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Order form */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {!selected ? (
            <div className="glass flex-1 flex flex-col items-center justify-center gap-3 min-h-[300px] lg:min-h-0">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(139,92,246,0.08)] flex items-center justify-center">
                <BsGrid size={24} className="text-[#475569]" />
              </div>
              <p className="text-[#475569] text-sm text-center">
                เลือกบริการจากรายการด้านซ้าย<br />
                <span className="text-[#334155] text-xs">ใช้แท็บแพลตฟอร์มหรือค้นหาเพื่อกรอง</span>
              </p>
            </div>
          ) : (
            <form onSubmit={placeOrder} className="flex flex-col gap-4">
              {/* Service info card */}
              <div className="glass p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-1">บริการที่เลือก</p>
                    <p className="font-semibold text-white text-sm leading-snug">{selected.name}</p>
                    <p className="text-xs text-[#475569] mt-0.5">{selected.category}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-[rgba(139,92,246,0.12)] text-[#a78bfa] shrink-0">
                    #{selected.service}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#94A3B8] border-t border-[rgba(139,92,246,0.08)] pt-3">
                  <span>ประเภท: <span className="text-[#c4b5fd]">{selected.type}</span></span>
                  <span>ราคา: <span className="text-[#06B6D4] font-mono">${Number(selected.rate).toFixed(4)}/1K</span></span>
                  <span>
                    Min–Max:{' '}
                    <span className="text-white font-mono">
                      {Number(selected.min).toLocaleString()} – {Number(selected.max).toLocaleString()}
                    </span>
                  </span>
                  <span>
                    Refill:{' '}
                    <span className={selected.refill ? 'text-emerald-400' : 'text-[#475569]'}>
                      {selected.refill ? '✓' : '✗'}
                    </span>
                  </span>
                  <span>
                    Cancel:{' '}
                    <span className={selected.cancel ? 'text-emerald-400' : 'text-[#475569]'}>
                      {selected.cancel ? '✓' : '✗'}
                    </span>
                  </span>
                  <span className="text-[#334155]">via {selected.provider}</span>
                </div>
              </div>

              {/* Link */}
              <div className="glass p-5 space-y-3">
                <label className="text-[10px] text-[#475569] uppercase tracking-widest block">
                  Link / URL เป้าหมาย
                </label>
                <input
                  type="url" value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="https://www.instagram.com/username"
                  className="w-full glass px-4 py-3 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
                  required
                />
              </div>

              {/* Quantity + Price */}
              <div className="glass p-5 space-y-4">
                <div>
                  <label className="text-[10px] text-[#475569] uppercase tracking-widest block mb-2">
                    จำนวน
                    <span className="ml-1.5 text-[#334155] normal-case font-normal">
                      ({Number(selected.min).toLocaleString()} – {Number(selected.max).toLocaleString()})
                    </span>
                  </label>
                  <input
                    type="number" value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder={String(selected.min)}
                    min={selected.min} max={selected.max}
                    className={[
                      'w-full glass px-4 py-3 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border transition-colors',
                      quantity && !qtyValid
                        ? 'border-rose-500/50 focus:border-rose-500'
                        : 'border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)]',
                    ].join(' ')}
                    required
                  />
                  {quantity && !qtyValid && (
                    <p className="text-[11px] text-rose-400 mt-1.5">
                      จำนวนต้องอยู่ระหว่าง {Number(selected.min).toLocaleString()} – {Number(selected.max).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Quick qty buttons */}
                {selected && (
                  <div className="flex flex-wrap gap-1.5">
                    {[100, 500, 1000, 5000, 10000].filter(v => v >= Number(selected.min) && v <= Number(selected.max)).map(v => (
                      <button
                        key={v} type="button"
                        onClick={() => setQuantity(String(v))}
                        className="glass-tab px-3 py-1 text-xs text-[#94A3B8] hover:text-white transition-colors"
                      >
                        {v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}

                {/* Price summary */}
                <div className="flex items-center justify-between pt-2 border-t border-[rgba(139,92,246,0.08)]">
                  <div>
                    <p className="text-[10px] text-[#475569] uppercase tracking-widest mb-1">ราคาโดยประมาณ</p>
                    <p className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-[#06B6D4] text-glow-cyan">
                      {costThb !== null ? `฿${costThb.toFixed(2)}` : '฿0.00'}
                    </p>
                    {costThb !== null && balance !== null && (
                      <p className={`text-[11px] mt-0.5 ${canAfford ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {canAfford
                          ? `ยอดคงเหลือ ฿${balance.toFixed(2)} — เพียงพอ`
                          : `ยอดไม่เพียงพอ — ต้องการอีก ฿${(costThb - balance).toFixed(2)}`}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="btn-primary flex items-center gap-2 px-8 py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        กำลังสั่ง...
                      </>
                    ) : (
                      <><BsCheckLg size={14} /> สั่งซื้อ</>
                    )}
                  </button>
                </div>
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
                      <Link href="/orders" className="ml-2 underline text-emerald-300 text-xs hover:text-emerald-200 transition-colors inline-flex items-center gap-1">
                        ดูออเดอร์ <BsArrowRight size={10} />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
