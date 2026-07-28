'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BsList, BsX } from 'react-icons/bs';
import { useLocale } from './LocaleProvider';
import AuthModal from './auth/AuthModal';

interface NavbarProps {
  brandName?: string;
  logoUrl?: string;
}

export default function Navbar({ brandName = 'AURA SMM' }: NavbarProps) {
  const path = usePathname();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/#services', label: t('nav.services') },
    { href: '/#pricing', label: t('nav.pricing') },
    { href: '/blog', label: t('nav.blog') },
  ];

  const parts = brandName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] || 'AURA';
  const rest  = parts.slice(1).join(' ') || 'SMM';

  return (
    <>
      {/* Floating nav wrapper */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 pt-4">
        <div className={['max-w-6xl mx-auto pg-nav px-4 h-14 flex items-center gap-3', scrolled ? 'pg-nav-scrolled' : ''].join(' ')}>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden shrink-0 text-[#2D1B4E]"
            aria-label="Toggle menu"
          >
            {open ? <BsX size={20} /> : <BsList size={20} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt={brandName}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/icon.png'; }}
              />
            </div>
            <span className="hidden md:block text-sm font-bold tracking-tight">
              <span className="pg-text-gradient">{first}</span>
              {rest ? <span className="text-[#2D1B4E]"> {rest}</span> : null}
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex flex-1 justify-center items-center gap-0.5">
            {navItems.map(({ href, label }) => {
              const active = path === href || (href.startsWith('/blog') && path.startsWith('/blog'));
              return (
                <Link
                  key={href}
                  href={href}
                  className={['pg-nav-link', active ? 'pg-nav-link-active' : ''].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1 md:hidden" />

          {/* Auth */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="hidden md:inline-flex pg-btn-outline px-4 py-1.5 text-sm"
            >
              {t('nav.login')}
            </Link>
            <Link href="/register" className="pg-btn-primary px-5 py-2 text-sm">
              {t('nav.register')}
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={['max-w-6xl mx-auto mt-2 overflow-hidden transition-all duration-250', open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'].join(' ')}>
          <div className="pg-glass px-5 py-4 space-y-1">
            {navItems.map(({ href, label }) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={[
                    'block px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
                    active ? 'bg-white/40 text-[#2D1B4E]' : 'text-[#4A3B63] hover:bg-white/25',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/25 mt-2">
              <Link href="/login"    onClick={() => setOpen(false)} className="pg-btn-outline justify-center px-4 py-2.5 text-sm">
                {t('nav.login')}
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="pg-btn-primary justify-center px-4 py-2.5 text-sm">
                {t('nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </header>
      <AuthModal open={authOpen} view={authView} onChangeView={setAuthView} onClose={() => setAuthOpen(false)} />
    </>
  );
}
