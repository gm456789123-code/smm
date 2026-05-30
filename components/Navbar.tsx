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
import LangSwitcher from './LangSwitcher';

interface NavbarProps { brandName?: string }

export default function Navbar({ brandName = 'AURA SMM' }: NavbarProps) {
  const path              = usePathname();
  const { t }             = useLocale();
  const [open, setOpen]   = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV_ITEMS = [
    { href: '/',          label: t('nav.home'),     icon: BsHouseDoorFill },
    { href: '/#services', label: t('nav.services'), icon: BsGrid          },
    { href: '/#pricing',  label: t('nav.pricing'),  icon: BsCurrencyDollar },
    { href: '/blog',      label: t('nav.blog'),      icon: BsFileText       },
  ];

  const [first, ...rest] = brandName.split(' ');

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[rgba(7,9,15,0.90)] backdrop-blur-2xl border-b border-[rgba(139,92,246,0.14)] shadow-[0_4px_40px_rgba(0,0,0,0.5)]'
          : 'bg-transparent',
      ].join(' ')}
    >
      {/* Top accent line */}
      {scrolled && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.6)] to-transparent" />
      )}

      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">

        {/* ── Brand ─────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.5)] group-hover:shadow-[0_0_24px_rgba(139,92,246,0.7)] transition-shadow">
            <span className="text-white text-xs font-black tracking-tighter">
              {first[0]}{rest[0]?.[0] ?? ''}
            </span>
          </div>
          <span className="font-[family-name:var(--font-jakarta)] text-base font-extrabold tracking-tight">
            <span className="text-gradient-animated">{first}</span>
            {rest.length > 0 && <span className="text-white"> {rest.join(' ')}</span>}
          </span>
        </Link>

        {/* ── Desktop nav ───────────────────────── */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.10)]">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/' && path.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-[rgba(139,92,246,0.25)] to-[rgba(6,182,212,0.10)] text-white border border-[rgba(139,92,246,0.35)] shadow-[0_0_16px_rgba(139,92,246,0.20),inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[rgba(139,92,246,0.10)] hover:border hover:border-[rgba(139,92,246,0.20)]',
                ].join(' ')}
              >
                <Icon size={13} className={active ? 'text-[#a78bfa]' : 'text-[#475569]'} />
                {label}
                {active && (
                  <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-px bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Auth buttons ──────────────────────── */}
        <div className="hidden md:flex items-center gap-2">
          <LangSwitcher />
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#94A3B8] hover:text-white border border-transparent hover:border-[rgba(139,92,246,0.22)] hover:bg-[rgba(139,92,246,0.08)] transition-all"
          >
            <BsBoxArrowInRight size={14} />
            {t('nav.login')}
          </Link>
          <Link
            href="/register"
            className="btn-primary flex items-center gap-2 px-5 py-2 text-sm"
          >
            <BsPersonPlus size={14} />
            {t('nav.register')}
          </Link>
        </div>

        {/* ── Mobile burger ─────────────────────── */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-[rgba(139,92,246,0.20)] bg-[rgba(139,92,246,0.08)] text-[#94A3B8] hover:text-white transition-colors"
          aria-label="toggle menu"
        >
          {open ? <BsX size={18} /> : <BsList size={18} />}
        </button>
      </div>

      {/* ── Mobile menu ───────────────────────── */}
      <div className={[
        'md:hidden overflow-hidden transition-all duration-300',
        open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0',
      ].join(' ')}>
        <div className="bg-[rgba(7,9,15,0.97)] backdrop-blur-2xl border-t border-[rgba(139,92,246,0.12)] px-5 py-4 space-y-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
                    : 'text-[#94A3B8] hover:bg-[rgba(139,92,246,0.08)] hover:text-white',
                ].join(' ')}
              >
                <Icon size={15} className={active ? 'text-[#a78bfa]' : 'text-[#475569]'} />
                {label}
              </Link>
            );
          })}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[rgba(139,92,246,0.10)] mt-2">
            <Link href="/login" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-[#94A3B8] border border-[rgba(139,92,246,0.15)] hover:text-white hover:border-[rgba(139,92,246,0.30)] transition-all">
              <BsBoxArrowInRight size={14} /> {t('nav.login')}
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}
              className="btn-primary flex items-center justify-center gap-2 py-3 text-sm">
              <BsPersonPlus size={14} /> {t('nav.register')}
            </Link>
          </div>
          <div className="pt-2 flex justify-center">
            <LangSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
