'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV = [
  {
    href: '/dashboard',
    label: 'หน้าหลัก',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    href: '/order',
    label: 'สั่งซื้อ',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v8M8 12h8" /></svg>,
  },
  {
    href: '/orders',
    label: 'ออเดอร์ของฉัน',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /><path strokeLinecap="round" d="M9 12h6M9 16h4" /></svg>,
  },
  {
    href: '/services',
    label: 'บริการทั้งหมด',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h10M4 18h6" /></svg>,
  },
  {
    href: '/topup',
    label: 'เติมเงิน',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 4v16m-4-4l4 4 4-4" /><path strokeLinecap="round" d="M20 12H4" /></svg>,
  },
  {
    href: '/balance',
    label: 'ยอดเงิน',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" /><path strokeLinecap="round" d="M12 6v2m0 8v2M9.5 9.5A2.5 2.5 0 0112 8h.5a2 2 0 010 4H12a2 2 0 000 4h.5a2.5 2.5 0 002.5-2.5" /></svg>,
  },
  {
    href: '/profile',
    label: 'โปรไฟล์',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  },
];

const ADMIN_NAV = [
  {
    href: '/admin',
    label: 'แดชบอร์ด',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    href: '/admin/users',
    label: 'จัดการผู้ใช้',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    href: '/admin/orders',
    label: 'จัดการออเดอร์',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    href: '/admin/blog',
    label: 'จัดการบทความ',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    href: '/admin/settings',
    label: 'ตั้งค่าเว็บ',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

interface SidebarProps {
  role: 'user' | 'admin';
  username: string;
}

export default function Sidebar({ role, username }: SidebarProps) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // ปิด sidebar เมื่อเปลี่ยนหน้า
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

  function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    const active = path === href || (href !== '/dashboard' && href !== '/admin' && path.startsWith(href));
    return (
      <Link href={href}
        className={['glass-tab flex items-center gap-3 px-4 py-3 text-base font-medium',
          active ? 'glass-tab-active' : 'text-white hover:text-white'].join(' ')}>
        <span className={active ? 'text-[#a78bfa]' : 'text-[#CBD5E1]'}>{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 glass p-2.5 rounded-xl text-white"
        aria-label="เปิดเมนู"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop — mobile only */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={[
        'glass-strong w-72 min-h-screen flex flex-col px-4 py-6 gap-1 shrink-0',
        'fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}>
      {/* Logo */}
      <div className="px-3 pb-5 mb-1 border-b border-[rgba(139,92,246,0.10)] flex items-start justify-between">
        <div>
          <p className="font-[family-name:var(--font-jakarta)] text-xl font-extrabold tracking-tight">
            <span className="text-[#8B5CF6] text-glow-indigo">AURA</span>
            <span className="text-white"> SMM</span>
          </p>
          <p className="text-xs text-[#475569] mt-0.5 uppercase tracking-widest">Social Media Panel</p>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-[#475569] hover:text-white p-1">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* User info */}
      <div className="px-3 py-3 mb-1 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[rgba(139,92,246,0.25)] flex items-center justify-center text-sm font-bold text-[#a78bfa]">
          {username[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F1F5F9] truncate">{username}</p>
          <p className="text-xs text-[#475569]">{role === 'admin' ? '👑 Admin' : 'ผู้ใช้งาน'}</p>
        </div>
      </div>

      {/* User Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map((item) => <NavItem key={item.href} {...item} />)}

        {/* Admin section */}
        {role === 'admin' && (
          <>
            <div className="mt-3 mb-1 px-3">
              <p className="text-[10px] text-[#334155] uppercase tracking-widest">จัดการระบบ</p>
            </div>
            {ADMIN_NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className={['glass-tab flex items-center gap-3 px-4 py-3 text-base font-medium border-[rgba(251,191,36,0.15)]',
                  path === item.href || (item.href !== '/admin' && path.startsWith(item.href))
                    ? 'glass-tab-active !border-[rgba(251,191,36,0.4)] !bg-[rgba(251,191,36,0.12)]'
                    : 'text-white hover:text-white'].join(' ')}>
                <span className={path.startsWith(item.href) ? 'text-yellow-400' : 'text-[#CBD5E1]'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Balance */}
      <div className="glass-tab px-3 py-3 mt-2 border-[rgba(6,182,212,0.2)]">
        <p className="text-[10px] text-[#475569] uppercase tracking-wider">ยอดเงิน</p>
        <p className="text-[#06B6D4] text-glow-cyan font-bold font-[family-name:var(--font-inter)] text-base mt-0.5">
          ฿0.00 <span className="text-[#475569] text-xs font-normal">THB</span>
        </p>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="glass-tab flex items-center gap-3 px-4 py-3 text-base text-[#CBD5E1] hover:text-red-400 transition-colors mt-1">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        ออกจากระบบ
      </button>


      </aside>
    </>
  );
}
