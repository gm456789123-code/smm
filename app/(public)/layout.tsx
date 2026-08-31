import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PdpaConsent from '@/components/PdpaConsent';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { SITE_URL } from '@/lib/site';

async function getBrand() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('brand_name','brand_tagline','brand_desc','logo_url')"
    );
    const s = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    return {
      name:     s.brand_name    ?? 'AURA SMM',
      tagline:  s.brand_tagline ?? '',
      desc:     s.brand_desc    ?? '',
      logoUrl:  s.logo_url      || '/logo.png',
    };
  } catch {
    return { name: 'AURA SMM', tagline: '', desc: '', logoUrl: '/logo.png' };
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
  const parts      = name.trim().split(/\s+/).filter(Boolean);
  const brandFirst = parts[0] || 'AURA';
  const brandRest  = parts.slice(1).join(' ');

  return (
    <div className="pastel-layout min-h-screen flex flex-col">
      <Navbar brandName={name} logoUrl="/logo.png" />
      {/* pt-24 accounts for floating nav (16px top offset + 56px height + gap) */}
      <main className="flex-1 pt-24">{children}</main>
      <footer className="pg-footer py-10">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm">
                <span className="pg-text-gradient">{brandFirst}</span>
                {brandRest ? <span className="text-[#2D1B4E]"> {brandRest}</span> : null}
              </p>
              <p className="text-xs text-[#8B7A9E] mt-1">
                © {new Date().getFullYear()} {name} · Developed by <span className="text-[#9B6DD5]">Saint</span>
              </p>
            </div>
            <nav className="flex items-center flex-wrap justify-center gap-5 text-sm text-[#4A3B63]">
              <Link href="/blog"      className="hover:text-[#2D1B4E] transition-colors">Blog</Link>
              <Link href="/#services" className="hover:text-[#2D1B4E] transition-colors">Services</Link>
              <Link href="/#pricing"  className="hover:text-[#2D1B4E] transition-colors">Pricing</Link>
              <Link href="/terms"     className="hover:text-[#2D1B4E] transition-colors">Terms</Link>
              <Link href="/privacy"   className="hover:text-[#2D1B4E] transition-colors">Privacy</Link>
              <Link href="/register"  className="text-[#9B6DD5] hover:text-[#2D1B4E] transition-colors font-semibold">
                Register
              </Link>
            </nav>
          </div>
        </div>
      </footer>
      <PdpaConsent />
    </div>
  );
}
