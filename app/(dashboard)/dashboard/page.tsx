'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Service } from '@/lib/smm-api';
import {
  BsArrowRight, BsWallet2, BsBoxSeam,
  BsClockHistory, BsCheckCircle, BsExclamationCircle,
  BsCheckLg,
  BsFacebook, BsInstagram, BsTiktok, BsYoutube, BsTwitterX,
  BsTwitch, BsCart3, BsGrid, BsStars, BsTelegram, BsSpotify,
  BsDiscord, BsLinkedin, BsWhatsapp,
} from 'react-icons/bs';

const PLATFORMS = [
  { id: 'ทั้งหมด',   icon: BsGrid },
  { id: 'Facebook',  icon: BsFacebook },
  { id: 'Instagram', icon: BsInstagram },
  { id: 'TikTok',    icon: BsTiktok },
  { id: 'YouTube',   icon: BsYoutube },
  { id: 'Twitter/X', icon: BsTwitterX },
  { id: 'Telegram',  icon: BsTelegram },
  { id: 'Spotify',   icon: BsSpotify },
  { id: 'Discord',   icon: BsDiscord },
  { id: 'LinkedIn',  icon: BsLinkedin },
  { id: 'WhatsApp',  icon: BsWhatsapp },
  { id: 'Twitch',    icon: BsTwitch },
  { id: 'Shopee',    icon: BsCart3 },
  { id: 'อื่นๆ',     icon: BsStars },
];

const has = (c: string, ...words: string[]) =>
  words.some(w => c.toLowerCase().includes(w.toLowerCase()));

function matchPlatform(name: string, category: string, platform: string): boolean {
  if (platform === 'ทั้งหมด') return true;
  const c = category;
  if (platform === 'Facebook') return has(c, 'แอปฟ้า', 'facebook');
  if (platform === 'Instagram') return has(c, 'แอปชมพู', 'instagram');
  if (platform === 'TikTok') return has(c, 'ติ๊กต็อก', 'tiktok');
  if (platform === 'YouTube') return has(c, 'youtube');
  if (platform === 'Twitter/X') return has(c, 'ทวิตเตอร์', 'twitter');
  if (platform === 'Telegram') return has(c, 'telegram');
  if (platform === 'Spotify') return has(c, 'spotify');
  if (platform === 'Discord') return has(c, 'discord');
  if (platform === 'LinkedIn') return has(c, 'linkedin');
  if (platform === 'WhatsApp') return has(c, 'whatsapp');
  if (platform === 'Twitch') return has(c, 'twitch');
  if (platform === 'Shopee') return has(c, 'shopee', 'ช้อปปี้');
  if (platform === 'อื่นๆ') return !has(c, 'แอปฟ้า','facebook','แอปชมพู','instagram','ติ๊กต็อก','tiktok','youtube','ทวิตเตอร์','twitter','telegram','spotify','discord','linkedin','whatsapp','twitch','shopee','ช้อปปี้');
  return false;
}

const EXCHANGE_RATE = Number(process.env.NEXT_PUBLIC_SMM_EXCHANGE_RATE ?? 36);
const MARKUP        = Number(process.env.NEXT_PUBLIC_SMM_MARKUP ?? 1.3);

function calcCostThb(quantity: number, rateUsd: number) {
  return Math.ceil((quantity / 1000) * rateUsd * EXCHANGE_RATE * MARKUP * 100) / 100;
}

interface UserData { balance: number; username: string; }
interface OrderRow {
  id: number; amount: number; ref: string;
  tx_status: string; note: string; created_at: string;
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'รอดำเนินการ', cls: 'bg-amber-500/10 text-amber-400' },
  completed:  { label: 'สำเร็จ',      cls: 'bg-emerald-500/10 text-emerald-400' },
  partial:    { label: 'บางส่วน',     cls: 'bg-blue-500/10 text-blue-400' },
  cancelled:  { label: 'ยกเลิก',      cls: 'bg-rose-500/10 text-rose-400' },
  processing: { label: 'กำลังทำ',     cls: 'bg-violet-500/10 text-violet-400' },
};

export default function DashboardPage() {
  const [user,     setUser]     = useState<UserData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [orders,   setOrders]   = useState<OrderRow[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Quick Order form state
  const [platform,  setPlatform]  = useState('ทั้งหมด');
  const [serviceId, setServiceId] = useState('');
  const [link,      setLink]      = useState('');
  const [quantity,  setQuantity]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // serviceId format: "provider:id" e.g. "24social:123"
  const [selProvider, selId] = serviceId.includes(':') ? serviceId.split(':') : ['24social', serviceId];

  const selectedService = useMemo(
    () => services.find(s => s.provider === selProvider && String(s.service) === selId),
    [services, selProvider, selId]
  );

  const filteredServices = useMemo(
    () => services.filter(s => matchPlatform(s.name, s.category, platform)),
    [services, platform]
  );

  const costThb = useMemo(() => {
    if (!selectedService || !quantity) return null;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return null;
    return calcCostThb(qty, Number(selectedService.rate));
  }, [selectedService, quantity]);

  const qtyNum    = Number(quantity);
  const qtyMin    = Number(selectedService?.min ?? 0);
  const qtyMax    = Number(selectedService?.max ?? 0);
  const qtyValid  = selectedService
    ? Number.isFinite(qtyNum) && qtyNum >= qtyMin && qtyNum <= qtyMax
    : false;
  const canSubmit = !!serviceId && !!link && !!quantity && qtyValid && !submitting;

  // Load data on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/user/me').then(r => r.json()).catch(() => null),
      fetch('/api/smm/services').then(r => r.json()).catch(() => []),
      fetch('/api/orders').then(r => r.json()).catch(() => []),
    ]).then(([u, svcs, ords]) => {
      if (u && !u.error) setUser(u);
      setServices(Array.isArray(svcs) ? svcs : []);
      setOrders(Array.isArray(ords) ? ords : []);
      setLoading(false);
    });
  }, []);

  // Reset service when platform changes
  useEffect(() => { setServiceId(''); setQuantity(''); }, [platform]);
  useEffect(() => { setQuantity(''); }, [serviceId]);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ serviceId: Number(selId), provider: selProvider, link, quantity: Number(quantity) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg({ type: 'error', text: data.error ?? 'เกิดข้อผิดพลาด' });
      } else {
        setMsg({ type: 'success', text: `สั่งซื้อสำเร็จ! Order #${data.orderId} ยอดเงินคงเหลือ ฿${Number(data.balance).toFixed(2)}` });
        setLink(''); setQuantity(''); setServiceId('');
        // Refresh balance + orders
        const [newUser, newOrds] = await Promise.all([
          fetch('/api/user/me').then(r => r.json()).catch(() => null),
          fetch('/api/orders').then(r => r.json()).catch(() => []),
        ]);
        if (newUser && !newUser.error) setUser(newUser);
        setOrders(Array.isArray(newOrds) ? newOrds : []);
      }
    } catch {
      setMsg({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    } finally {
      setSubmitting(false);
    }
  }

  const totalOrders     = orders.length;
  const activeOrders    = orders.filter(o => o.tx_status === 'pending' || o.tx_status === 'processing').length;
  const completedOrders = orders.filter(o => o.tx_status === 'completed').length;

  const STATS = [
    {
      icon: BsWallet2,
      label: 'ยอดคงเหลือ',
      value: loading ? '...' : `฿${Number(user?.balance ?? 0).toFixed(2)}`,
      color: 'text-[#06B6D4]', glow: 'text-glow-cyan',
      iconBg: 'bg-[rgba(6,182,212,0.18)]', iconColor: '#06B6D4',
      border: 'border-t-[#06B6D4]/60',
      shadow: 'hover:shadow-[0_8px_32px_rgba(6,182,212,0.18)]',
      href: '/topup',
    },
    {
      icon: BsBoxSeam,
      label: 'ออเดอร์ทั้งหมด',
      value: loading ? '...' : String(totalOrders),
      color: 'text-[#8B5CF6]', glow: 'text-glow-indigo',
      iconBg: 'bg-[rgba(139,92,246,0.18)]', iconColor: '#8B5CF6',
      border: 'border-t-[#8B5CF6]/60',
      shadow: 'hover:shadow-[0_8px_32px_rgba(139,92,246,0.20)]',
      href: '/orders',
    },
    {
      icon: BsClockHistory,
      label: 'กำลังดำเนินการ',
      value: loading ? '...' : String(activeOrders),
      color: 'text-amber-400', glow: '',
      iconBg: 'bg-amber-500/20', iconColor: '#f59e0b',
      border: 'border-t-amber-400/60',
      shadow: 'hover:shadow-[0_8px_32px_rgba(245,158,11,0.18)]',
      href: '/orders',
    },
    {
      icon: BsCheckCircle,
      label: 'สำเร็จแล้ว',
      value: loading ? '...' : String(completedOrders),
      color: 'text-emerald-400', glow: '',
      iconBg: 'bg-emerald-500/20', iconColor: '#10b981',
      border: 'border-t-emerald-400/60',
      shadow: 'hover:shadow-[0_8px_32px_rgba(16,185,129,0.18)]',
      href: '/orders',
    },
  ];

  return (
    <main className="flex-1 p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-[#475569] text-sm mt-0.5">
            ยินดีต้อนรับกลับ{user?.username ? `, ${user.username}` : ''}
          </p>
        </div>
        <Link 
          href="/topup"
          className="px-5 py-2.5 text-sm font-bold text-[#c4b5fd] bg-[#1e1b4b]/40 border border-[#8b5cf6]/40 rounded-xl hover:bg-[#8b5cf6]/20 hover:border-[#8b5cf6]/60 transition-all shadow-[0_4px_20px_rgba(139,92,246,0.15)]"
        >
          + เติมเงิน
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ icon: Icon, label, value, color, glow, iconBg, iconColor, border, shadow, href }) => (
          <Link key={label} href={href} className={`glass border-t-2 ${border} p-5 transition-all duration-300 ${shadow} group`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] text-[#64748b] uppercase tracking-widest">{label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                <Icon size={15} color={iconColor} />
              </div>
            </div>
            <p className={`font-[family-name:var(--font-jakarta)] text-2xl font-bold ${color} ${glow}`}>{value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Order */}
      <form onSubmit={placeOrder} className="glass p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white text-base">Quick Order</h2>
          <Link href="/services" className="flex items-center gap-1 text-xs text-[#475569] hover:text-[#c4b5fd] transition-colors">
            ดูบริการทั้งหมด <BsArrowRight size={11} />
          </Link>
        </div>

        {/* Platform tabs */}
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => {
            const Icon = p.icon;
            const count = services.filter(s => matchPlatform(s.name, s.category, p.id)).length;
            if (p.id !== 'ทั้งหมด' && count === 0) return null;
            return (
              <button
                type="button" key={p.id}
                onClick={() => setPlatform(p.id)}
                title={p.id}
                className={[
                  'glass-tab flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95',
                  platform === p.id ? 'glass-tab-active text-[#c4b5fd] shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-[#94A3B8]',
                ].join(' ')}
              >
                <span className="text-lg"><Icon /></span>
                <span>{p.id}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[rgba(139,92,246,0.15)] text-[#a78bfa] font-mono leading-none">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-5">

          {/* Service */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">
              บริการ {filteredServices.length > 0 && `(${filteredServices.length})`}
            </label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="glass px-4 py-3.5 text-base text-white bg-[rgba(255,255,255,0.05)] outline-none rounded-xl border border-[rgba(139,92,246,0.3)] focus:border-[rgba(139,92,246,0.6)] transition-colors"
              required
            >
              <option value="" className="bg-[#1E293B] text-white">-- เลือกบริการ --</option>
              {filteredServices.map(s => (
                <option key={`${s.provider}-${s.service}`} value={`${s.provider}:${s.service}`} className="bg-[#1E293B] text-white">
                  [{s.service}] {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Link */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">Link</label>
            <input
              type="url" value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://www.instagram.com/username"
              className="glass px-4 py-3.5 text-base text-white bg-[rgba(255,255,255,0.05)] outline-none placeholder-[#94A3B8] rounded-xl border border-[rgba(139,92,246,0.3)] focus:border-[rgba(139,92,246,0.6)] transition-colors"
              required
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">
              จำนวน
              {selectedService && (
                <span className="ml-1 text-[#94A3B8] normal-case">
                  ({Number(selectedService.min).toLocaleString()} – {Number(selectedService.max).toLocaleString()})
                </span>
              )}
            </label>
            <input
              type="number" value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder={selectedService ? String(selectedService.min) : '1000'}
              min={selectedService?.min} max={selectedService?.max}
              className={[
                'glass px-4 py-3.5 text-base text-white bg-[rgba(255,255,255,0.05)] outline-none placeholder-[#94A3B8] rounded-xl border transition-colors',
                quantity && !qtyValid
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-[rgba(139,92,246,0.3)] focus:border-[rgba(139,92,246,0.6)]',
              ].join(' ')}
              required
            />
          </div>
        </div>

        {/* Service info bar */}
        {selectedService && (
          <div className="flex flex-wrap gap-3 px-4 py-3 rounded-xl bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.12)] text-xs text-[#94A3B8]">
            <span>ประเภท: <span className="text-[#c4b5fd]">{selectedService.type}</span></span>
            <span>|</span>
            <span>หมวด: <span className="text-[#c4b5fd]">{selectedService.category}</span></span>
            <span>|</span>
            <span>ราคา API: <span className="text-[#06B6D4] font-mono">฿{Number(selectedService.rate).toFixed(3)}/1K</span></span>
            <span>|</span>
            <span>Refill: <span className={selectedService.refill ? 'text-emerald-400' : 'text-[#475569]'}>{selectedService.refill ? 'รองรับ' : 'ไม่รองรับ'}</span></span>
          </div>
        )}

        {/* Price + Submit */}
        <div className="flex items-center justify-between pt-1 gap-4">
          <div>
            <p className="text-xs text-[#475569] mb-0.5">ราคาโดยประมาณ</p>
            <p className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-[#06B6D4]">
              {costThb !== null ? `฿${costThb.toFixed(2)}` : '฿0.00'}
            </p>
            {costThb !== null && user && (
              <p className={`text-[10px] mt-0.5 ${Number(user.balance) >= costThb ? 'text-emerald-500' : 'text-rose-400'}`}>
                {Number(user.balance) >= costThb ? `ยอดคงเหลือเพียงพอ` : `ยอดไม่เพียงพอ — เติมเงิน`}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary flex items-center gap-2 px-7 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? (
              <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> กำลังสั่ง...</>
            ) : (
              <><BsCheckLg size={14} /> Place Order</>
            )}
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
              : <BsExclamationCircle size={15} className="shrink-0 mt-0.5" />
            }
            {msg.text}
          </div>
        )}
      </form>

      {/* Recent Orders */}
      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white text-base">ออเดอร์ล่าสุด</h2>
          <Link href="/orders" className="flex items-center gap-1 text-xs text-[#475569] hover:text-[#c4b5fd] transition-colors">
            ดูทั้งหมด <BsArrowRight size={11} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 pr-4">บริการ / Link</th>
                <th className="pb-3 pr-4">ราคา</th>
                <th className="pb-3 pr-4">สถานะ</th>
                <th className="pb-3">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-[#475569] animate-pulse">กำลังโหลด...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-[#475569]">ยังไม่มีออเดอร์ — สั่งบริการแรกของคุณได้เลย</td></tr>
              ) : orders.slice(0, 5).map(o => {
                const [svcName, orderLink] = (o.note ?? '').split(' | ');
                const statusCfg = STATUS_CFG[o.tx_status] ?? { label: o.tx_status, cls: 'bg-[rgba(71,85,105,0.2)] text-[#475569]' };
                return (
                  <tr key={o.id} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-[#475569]">#{o.ref}</td>
                    <td className="py-3 pr-4 max-w-[240px]">
                      <p className="text-[#F1F5F9] text-xs truncate">{svcName ?? '—'}</p>
                      {orderLink && (
                        <a href={orderLink} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-[#475569] hover:text-[#c4b5fd] truncate block max-w-[220px] transition-colors">
                          {orderLink}
                        </a>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold text-[#06B6D4]">฿{Number(o.amount).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[#475569]">
                      {new Date(o.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
}
