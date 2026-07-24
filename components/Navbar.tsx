'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  BsGrid, BsCurrencyDollar, BsFileText,
  BsPersonPlus, BsBoxArrowInRight,
  BsHouseDoorFill, BsList, BsX,
} from 'react-icons/bs';
import { useLocale } from './LocaleProvider';
import AuthModal from './auth/AuthModal';

interface NavbarProps {
  brandName?: string;
  logoUrl?: string;
}

export default function Navbar({ brandName = 'AURA SMM', logoUrl: logoProp }: NavbarProps) {
  const path = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const logoUrl = '/logo.png';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { href: '/', label: t('nav.home'), icon: BsHouseDoorFill },
    { href: '/#services', label: t('nav.services'), icon: BsGrid },
    { href: '/#pricing', label: t('nav.pricing'), icon: BsCurrencyDollar },
    { href: '/blog', label: t('nav.blog'), icon: BsFileText },
  ];

  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || 'AURA';
  const rest = parts.slice(1).join(' ') || 'SMM';

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-[rgba(7,9,15,0.90)] backdrop-blur-2xl border-b border-[rgba(139,92,246,0.14)] shadow-[0_4px_40px_rgba(0,0,0,0.5)]'
            : 'bg-transparent',
        ].join(' ')}
      >
        {scrolled && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.6)] to-transparent" />}

        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-3">
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(139,92,246,0.20)] bg-[rgba(139,92,246,0.08)] text-[#CBD5E1] hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <BsX size={18} /> : <BsList size={18} />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-[0_0_16px_rgba(139,92,246,0.5)] group-hover:shadow-[0_0_24px_rgba(139,92,246,0.7)] transition-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={brandName ?? 'AURA Panel'} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/icon.png'; }} />
            </div>
            <span className="hidden md:block font-[family-name:var(--font-jakarta)] text-base font-extrabold tracking-tight">
              <span className="text-gradient-animated">{first}</span>
              {rest ? <span className="text-white"> {rest}</span> : null}
            </span>
          </Link>

          <div className="hidden md:flex flex-1 justify-center">
            <nav className="flex items-center gap-1 p-1 rounded-2xl bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.10)]">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = path === href || (href !== '/' && path.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={[
                      'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-gradient-to-r from-[rgba(139,92,246,0.25)] to-[rgba(6,182,212,0.10)] text-white border border-[rgba(139,92,246,0.35)] shadow-[0_0_16px_rgba(139,92,246,0.20),inset_0_1px_0_rgba(255,255,255,0.08)]'
                        : 'text-[#CBD5E1] hover:text-white hover:bg-[rgba(139,92,246,0.10)] hover:border hover:border-[rgba(139,92,246,0.20)]',
                    ].join(' ')}
                  >
                    <Icon size={13} className={active ? 'text-[#c4b5fd]' : 'text-[#94A3B8]'} aria-hidden="true" focusable="false" />
                    {label}
                    {active && <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-px bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-medium text-[#CBD5E1] hover:text-white border border-[rgba(139,92,246,0.18)] hover:border-[rgba(139,92,246,0.35)] hover:bg-[rgba(139,92,246,0.08)] transition-all"
            >
              <BsBoxArrowInRight size={13} aria-hidden="true" focusable="false" />
              {t('nav.login')}
            </Link>
            <Link href="/register" className="btn-primary flex items-center gap-1.5 px-3 md:px-5 py-1.5 md:py-2 text-xs md:text-sm">
              <BsPersonPlus size={13} aria-hidden="true" focusable="false" />
              {t('nav.register')}
            </Link>
          </div>
        </div>

        <div className={['md:hidden overflow-hidden transition-all duration-300', open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'].join(' ')}>
          <div className="bg-[rgba(7,9,15,0.97)] backdrop-blur-2xl border-t border-[rgba(139,92,246,0.12)] px-5 py-4 space-y-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = path === href || (href !== '/' && path.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={[
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-gradient-to-r from-[rgba(139,92,246,0.20)] to-[rgba(6,182,212,0.08)] text-white border border-[rgba(139,92,246,0.30)]'
                      : 'text-[#CBD5E1] hover:bg-[rgba(139,92,246,0.08)] hover:text-white',
                  ].join(' ')}
                >
                  <Icon size={15} className={active ? 'text-[#c4b5fd]' : 'text-[#94A3B8]'} aria-hidden="true" focusable="false" />
                  {label}
                </Link>
              );
            })}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[rgba(139,92,246,0.10)] mt-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-[#CBD5E1] border border-[rgba(139,92,246,0.15)] hover:text-white hover:border-[rgba(139,92,246,0.30)] transition-all"
              >
                <BsBoxArrowInRight size={14} aria-hidden="true" focusable="false" /> {t('nav.login')}
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="btn-primary flex items-center justify-center gap-2 py-3 text-sm"
              >
                <BsPersonPlus size={14} aria-hidden="true" focusable="false" /> {t('nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </header>
      <AuthModal open={authOpen} view={authView} onChangeView={setAuthView} onClose={() => setAuthOpen(false)} />
    </>
  );
}
