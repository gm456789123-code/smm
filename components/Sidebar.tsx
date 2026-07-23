'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BsShieldFill } from 'react-icons/bs';
import { useEffect, useState } from 'react';
import { useLocale } from './LocaleProvider';
import LangSwitcher from './LangSwitcher';
import PushBell from './PushBell';

const NAV: { href: string; key: string; icon: React.ReactNode }[] = [
  {
    href: '/dashboard', key: 'navDashboard',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    href: '/order', key: 'navOrder',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v8M8 12h8" /></svg>,
  },
  {
    href: '/orders', key: 'navOrders',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /><path strokeLinecap="round" d="M9 12h6M9 16h4" /></svg>,
  },
  {
    href: '/mass-order', key: 'navMassOrder',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  },
  {
    href: '/services', key: 'navServices',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10M4 18h6" /></svg>,
  },
  {
    href: '/topup', key: 'navTopup',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 4v16m-4-4l4 4 4-4" /><path strokeLinecap="round" d="M20 12H4" /></svg>,
  },
  {
    href: '/balance', key: 'navBalance',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" /><path strokeLinecap="round" d="M12 6v2m0 8v2M9.5 9.5A2.5 2.5 0 0112 8h.5a2 2 0 010 4H12a2 2 0 000 4h.5a2.5 2.5 0 002.5-2.5" /></svg>,
  },
  {
    href: '/profile', key: 'navProfile',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  },
  {
    href: '/report', key: 'navReport',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  },
];

const ADMIN_NAV = [
  {
    href: '/admin', label: 'แดชบอร์ด',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    href: '/admin/users', label: 'จัดการผู้ใช้',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/admin/orders', label: 'จัดการออเดอร์',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    href: '/admin/topups', label: 'ประวัติเติมเงิน',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    href: '/admin/tickets', label: 'Support Tickets',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
  {
    href: '/admin/blog', label: 'จัดการบทความ',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    href: '/admin/media', label: 'คลังภาพ',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" d="M21 15l-5-5L5 21"/></svg>,
  },
  {
    href: '/admin/angpao', label: 'ซองอั้งเปา',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M20 12v7a1 1 0 01-1 1H5a1 1 0 01-1-1v-7M1 7h22v5H1zM12 7V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3" /></svg>,
  },
  {
    href: '/admin/settings', label: 'ตั้งค่าเว็บ',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

interface SidebarProps {
  role: 'user' | 'admin';
  username: string;
}

export default function Sidebar({ role, username }: SidebarProps) {
  const path = usePathname();
  const { t } = useLocale();
  const [open, setOpen]       = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const logoUrl = '/logo.png';
  const isCMS = path.startsWith('/admin');

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(d => {
      if (d && !d.error) setBalance(Number(d.balance));
    }).catch(() => null);
  }, [path]);

  useEffect(() => { setOpen(false); }, [path]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      window.location.href = '/';
    }
  }

  return (
    <>
      {/* Mobile top bar — z-40, sidebar sits above it when open */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-4 gap-3 border-b border-[rgba(139,92,246,0.15)]"
        style={{ background: 'rgba(13,18,32,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <button
          onClick={() => setOpen(true)}
          className="glass p-2.5 rounded-xl text-white shrink-0"
          aria-label="เปิดเมนู"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="logo" className="max-h-8 max-w-[140px] object-contain" />
        {/* <div className="ml-auto">
          <LangSwitcher />
        </div> */}
      </div>

      {/* Backdrop — sits between top bar (z-40) and sidebar (z-50) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — z-50, fully covers top bar on mobile when open */}
      <aside className={[
        'w-72 flex flex-col px-4 py-6 gap-1 shrink-0',
        'fixed inset-y-0 left-0 z-50',
        'border-r border-[rgba(255,255,255,0.07)]',
        'lg:sticky lg:top-0 lg:h-screen',
        'transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
        style={{ background: 'rgba(13,18,32,0.97)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)' }}>

        {/* Logo */}
        <div className="px-3 pb-5 mb-1 border-b border-[rgba(139,92,246,0.10)] flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-[0_0_12px_rgba(139,92,246,0.4)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="AURA Panel" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-[family-name:var(--font-jakarta)] text-base font-extrabold tracking-tight">
                  <span className="text-gradient-animated">AURA</span>
                  <span className="text-white"> Panel</span>
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 uppercase tracking-widest">Social Media Panel</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {role === 'admin' && isCMS && <PushBell />}
            <button onClick={() => setOpen(false)} className="lg:hidden text-[#475569] hover:text-white p-1">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="px-3 py-3 mb-1 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-sm font-bold text-white shadow-md shadow-purple-500/25 shrink-0">
            {username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F1F5F9] truncate">{username}</p>
            <p className="text-xs text-[#475569] flex items-center gap-1">
              {role === 'admin' && <BsShieldFill size={10} className="text-yellow-400" />}
              {role === 'admin' ? t('dash.sideRoleAdmin') : t('dash.sideRoleUser')}
            </p>
          </div>
        </div>

        {/* Nav — scrolls independently if content is taller than viewport */}
        <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
          {isCMS ? (
            ADMIN_NAV.map((item) => {
              const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={['glass-tab flex items-center gap-3 px-4 py-3 text-base font-medium border-[rgba(251,191,36,0.15)]',
                    active
                      ? 'glass-tab-active !border-[rgba(251,191,36,0.4)] !bg-[rgba(251,191,36,0.12)]'
                      : 'text-white hover:text-white'].join(' ')}>
                  <span className={active ? 'text-yellow-400' : 'text-[#CBD5E1]'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })
          ) : (
            NAV.map(({ href, key, icon }) => {
              const active = path === href || (href !== '/dashboard' && href !== '/admin' && path.startsWith(href));
              return (
                <Link key={href} href={href}
                  className={['glass-tab flex items-center gap-3 px-4 py-3 text-base font-medium',
                    active ? 'glass-tab-active' : 'text-white hover:text-white'].join(' ')}>
                  <span className={active ? 'text-[#a78bfa]' : 'text-[#CBD5E1]'}>{icon}</span>
                  {t(`dash.${key}`)}
                </Link>
              );
            })
          )}
        </nav>

        {/* CMS toggle — admin only */}
        {role === 'admin' && (
          isCMS ? (
            <Link href="/dashboard"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#94A3B8] hover:text-white border border-[rgba(139,92,246,0.2)] hover:border-[rgba(139,92,246,0.4)] hover:bg-[rgba(139,92,246,0.08)] transition-all mt-1">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('dash.navBack')}
            </Link>
          ) : (
            <Link href="/admin"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-yellow-400 hover:text-yellow-300 border border-[rgba(251,191,36,0.25)] hover:border-[rgba(251,191,36,0.5)] hover:bg-[rgba(251,191,36,0.06)] transition-all mt-1">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('dash.navCms')}
            </Link>
          )
        )}

        {/* Balance */}
        <div className="rounded-xl px-3 py-3 mt-2 border border-[rgba(6,182,212,0.25)] bg-[rgba(6,182,212,0.07)]">
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider font-semibold">{t('dash.sideBalance')}</p>
          <p className="text-[#06B6D4] text-glow-cyan font-bold font-[family-name:var(--font-inter)] text-base mt-0.5">
            {balance === null
              ? <span className="animate-pulse text-[#334155]">{t('dash.loading')}</span>
              : <>{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} <span className="text-[#64748B] text-xs font-normal">{t('dash.sideThb')}</span></>
            }
          </p>
        </div>

        {/* Logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-[rgba(239,68,68,0.08)] transition-all mt-1">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t('dash.navLogout')}
        </button>

      </aside>
    </>
  );
}
