'use client';

import Link from 'next/link';
import { useState } from 'react';

interface NavbarProps {
  brandName?: string;
}

export default function Navbar({ brandName = 'AURA SMM' }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const [first, second] = brandName.includes(' ')
    ? [brandName.split(' ')[0], brandName.split(' ').slice(1).join(' ')]
    : [brandName, ''];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-[rgba(139,92,246,0.10)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-[family-name:var(--font-jakarta)] text-lg font-extrabold tracking-tight">
          <span className="text-[#8B5CF6] text-glow-indigo">{first}</span>
          {second && <span className="text-white"> {second}</span>}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/',        label: 'หน้าแรก' },
            { href: '/#services', label: 'บริการ' },
            { href: '/#pricing',  label: 'ราคา' },
            { href: '/blog',    label: 'บทความ' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="glass-tab px-4 py-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9]"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="glass-tab px-4 py-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9]">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="glass-tab glass-tab-active px-4 py-2 text-sm font-semibold text-[#c4b5fd] hover:text-white">
            สมัครฟรี
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden glass-tab p-2 text-[#94A3B8]"
          aria-label="menu"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[rgba(139,92,246,0.10)] px-4 py-3 space-y-1 bg-[rgba(9,13,22,0.95)]">
          {[
            { href: '/', label: 'หน้าแรก' },
            { href: '/#services', label: 'บริการ' },
            { href: '/#pricing', label: 'ราคา' },
            { href: '/blog', label: 'บทความ' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="block glass-tab px-4 py-2.5 text-sm text-[#94A3B8]">
              {label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link href="/login" onClick={() => setOpen(false)}
              className="flex-1 glass-tab text-center py-2.5 text-sm text-[#94A3B8]">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}
              className="flex-1 glass-tab glass-tab-active text-center py-2.5 text-sm font-semibold text-[#c4b5fd]">
              สมัครฟรี
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
