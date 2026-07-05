'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Service } from '@/lib/smm-api';
import {
  BsArrowRight, BsWallet2, BsBoxSeam,
  BsClockHistory, BsCheckCircle, BsExclamationCircle,
  BsCheckLg,
} from 'react-icons/bs';

const PLATFORMS = ['ทั้งหมด', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter', 'Telegram', 'Spotify'];

const PLATFORM_KEYWORDS: Record<string, string[]> = {
  Instagram: ['instagram', 'ig '],
  TikTok:    ['tiktok', 'tik tok', 'tik-tok'],
  YouTube:   ['youtube', 'yt '],
  Facebook:  ['facebook', 'fb ', 'fb-'],
  Twitter:   ['twitter', ' x ', 'x followers', 'x likes', 'x retweet', 'tweet'],
  Telegram:  ['telegram', 'tg '],
  Spotify:   ['spotify'],
};

function matchPlatform(name: string, category: string, platform: string): boolean {
  if (platform === 'ทั้งหมด') return true;
  const text = `${name} ${category}`.toLowerCase();
  const keywords = PLATFORM_KEYWORDS[platform] ?? [platform.toLowerCase()];
  return keywords.some(kw => text.includes(kw));
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
      iconBg: 'bg-[rgba(6,182,212,0.10)]', iconColor: '#06B6D4',
      href: '/topup',
    },
    {
      icon: BsBoxSeam,
      label: 'ออเดอร์ทั้งหมด',
      value: loading ? '...' : String(totalOrders),
      color: 'text-[#8B5CF6]', glow: 'text-glow-indigo',
      iconBg: 'bg-[rgba(139,92,246,0.10)]', iconColor: '#8B5CF6',
      href: '/orders',
    },
    {
      icon: BsClockHistory,
      label: 'กำลังดำเนินการ',
      value: loading ? '...' : String(activeOrders),
      color: 'text-amber-400', glow: '',
      iconBg: 'bg-amber-500/10', iconColor: '#f59e0b',
      href: '/orders',
    },
    {
      icon: BsCheckCircle,
      label: 'สำเร็จแล้ว',
      value: loading ? '...' : String(completedOrders),
      color: 'text-emerald-400', glow: '',
      iconBg: 'bg-emerald-500/10', iconColor: '#10b981',
      href: '/orders',
    },
  ];

  return (
    <main className="flex-1 p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#475569] text-sm mt-0.5">
          ยินดีต้อนรับกลับ{user?.username ? `, ${user.username}` : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ icon: Icon, label, value, color, glow, iconBg, iconColor, href }) => (
          <Link key={label} href={href} className="glass p-5 hover:bg-[rgba(139,92,246,0.06)] transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] text-[#475569] uppercase tracking-widest">{label}</p>
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
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map(p => (
            <button
              type="button" key={p}
              onClick={() => setPlatform(p)}
              className={[
                'glass-tab px-3 py-1.5 text-xs font-medium transition-all',
                platform === p ? 'glass-tab-active text-[#c4b5fd]' : 'text-[#94A3B8]',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Service */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#475569] uppercase tracking-widest">
              บริการ {filteredServices.length > 0 && `(${filteredServices.length})`}
            </label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="glass px-3 py-2.5 text-sm text-[#F1F5F9] bg-[rgba(11,14,26,0.9)] outline-none rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
              required
            >
              <option value="" className="bg-[#0D1221]">-- เลือกบริการ --</option>
              {filteredServices.map(s => (
                <option key={`${s.provider}-${s.service}`} value={`${s.provider}:${s.service}`} className="bg-[#0D1221]">
                  [{s.service}] {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#475569] uppercase tracking-widest">Link</label>
            <input
              type="url" value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://www.instagram.com/username"
              className="glass px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
              required
            />
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-[#475569] uppercase tracking-widest">
              จำนวน
              {selectedService && (
                <span className="ml-1 text-[#334155] normal-case">
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
                'glass px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border transition-colors',
                quantity && !qtyValid
                  ? 'border-rose-500/50 focus:border-rose-500'
                  : 'border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)]',
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
            <span>ราคา API: <span className="text-[#06B6D4] font-mono">${Number(selectedService.rate).toFixed(3)}/1K</span></span>
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
