import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { SITE_URL } from '@/lib/site';

async function getBrand() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('brand_name','brand_tagline','brand_desc')"
    );
    const s = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    return { name: s.brand_name ?? 'AURA SMM', tagline: s.brand_tagline ?? '', desc: s.brand_desc ?? '' };
  } catch {
    return { name: 'AURA SMM', tagline: '', desc: '' };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { name, tagline, desc } = await getBrand();
  return {
    title: { default: `${name} - ${tagline}`, template: `%s | ${name}` },
    description: desc || tagline,
    openGraph: { siteName: name, title: `${name} - ${tagline}`, description: desc || tagline },
    alternates: { canonical: SITE_URL },
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { name } = await getBrand();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar brandName={name} />
      <main className="flex-1 pt-16">{children}</main>
      <footer className="border-t border-[rgba(139,92,246,0.10)] py-10">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-[family-name:var(--font-jakarta)] font-extrabold text-sm">
                <span className="text-gradient-animated">{name.split(' ')[0]}</span>
                <span className="text-white"> {name.split(' ').slice(1).join(' ')}</span>
              </p>
              <p className="text-xs text-[#94A3B8] mt-1">© {new Date().getFullYear()} {name} · Developed by <span className="text-[#C4B5FD]">Saint</span></p>
            </div>
            <nav className="flex items-center gap-4 text-xs text-[#CBD5E1]">
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <Link href="/#services" className="hover:text-white transition-colors">Services</Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/register" className="text-[#C4B5FD] hover:text-white transition-colors">Register</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
