import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { SITE_URL } from '@/lib/site';
import { BsShieldCheck, BsArrowRight } from 'react-icons/bs';

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
      <footer className="pg-footer pt-14 pb-10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 space-y-10">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Col 1 & 2: Brand Info (2 cols wide on lg) */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-block">
                <p className="font-extrabold text-xl tracking-tight">
                  <span className="pg-text-gradient">{brandFirst}</span>
                  {brandRest ? <span className="text-[#2D1B4E]"> {brandRest}</span> : null}
                </p>
              </Link>
              <p className="text-sm text-[#4A3B63] leading-relaxed max-w-sm">
                แพลตฟอร์ม SMM Panel ให้บริการเพิ่มยอดการมีส่วนร่วมและทำการตลาดโซเชียลมีเดียอันดับ 1
                ระบบอัตโนมัติ 24 ชม. ส่งมอบรวดเร็ว ปลอดภัย และมีนโยบายคุ้มครองผู้ใช้งานอย่างโปร่งใส
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#2D1B4E]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/40 border border-white/60 font-medium">
                  <BsShieldCheck className="text-emerald-600" /> มั่นใจ ปลอดภัย 100%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/40 border border-white/60 font-medium">
                  <BsArrowRight className="text-[#9B6DD5]" /> คืนเครดิตอัตโนมัติ
                </span>
              </div>
            </div>

            {/* Col 3: Services & Navigation */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">บริการ</p>
              <ul className="space-y-2 text-sm text-[#4A3B63]">
                <li><Link href="/#services" className="hover:text-[#9B6DD5] transition-colors">บริการทั้งหมด</Link></li>
                <li><Link href="/#pricing" className="hover:text-[#9B6DD5] transition-colors">แพ็กเกจและราคา</Link></li>
                <li><Link href="/blog" className="hover:text-[#9B6DD5] transition-colors">บทความ / สาระน่ารู้</Link></li>
                <li><Link href="/services" className="hover:text-[#9B6DD5] transition-colors">รายการเรทบริการ</Link></li>
              </ul>
            </div>

            {/* Col 4: Legal & Policies (Refund Policy Highlighted) */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">นโยบายและข้อกำหนด</p>
              <ul className="space-y-2.5 text-sm text-[#4A3B63]">
                <li>
                  <Link
                    href="/refund"
                    className="inline-flex items-center gap-1.5 font-bold text-[#7c3aed] hover:text-[#5b21b6] transition-colors"
                  >
                    <span>นโยบายการคืนเงิน (Refund Policy)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-semibold">แนะนำ</span>
                  </Link>
                  <p className="text-[11px] text-[#6B5B82] mt-0.5 leading-snug">
                    เงื่อนไขคืนเครดิต การยกเลิก และการเคลมเติมซ้ำ (Refill)
                  </p>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#9B6DD5] transition-colors">
                    นโยบายความเป็นส่วนตัว (Privacy / PDPA)
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#9B6DD5] transition-colors">
                    เงื่อนไขและข้อตกลงการใช้งาน (Terms)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 5: Security & Payment Channels */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#2D1B4E] uppercase tracking-wider">การชำระเงินที่รองรับ</p>
              <p className="text-xs text-[#4A3B63] leading-relaxed">
                ระบบชำระเงินมาตรฐานธนาคารระดับสากล ผ่าน Stripe และ พร้อมเพย์
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1 text-xs text-[#2D1B4E]">
                <span className="px-2.5 py-1 rounded-lg bg-white/50 border border-white/70 font-medium">พร้อมเพย์</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/50 border border-white/70 font-medium">Visa / Mastercard</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/50 border border-white/70 font-medium">Google Pay</span>
                <span className="px-2.5 py-1 rounded-lg bg-white/50 border border-white/70 font-medium">TrueMoney</span>
              </div>
              <div className="pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl shadow-md transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#9B6DD5,#7c3aed)' }}
                >
                  สมัครสมาชิกฟรี <BsArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Refund Guarantee Banner in Footer */}
          <div className="p-4 rounded-2xl bg-white/40 border border-white/70 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#4A3B63]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-700">
                <BsShieldCheck size={16} />
              </div>
              <div>
                <span className="font-bold text-[#2D1B4E]">การรับประกันความพึงพอใจและสิทธิประโยชน์สมาชิก:</span>{' '}
                <span>หากคำสั่งซื้อไม่สามารถส่งมอบได้หรือเกิดข้อผิดพลาด ระบบจะคืนยอดเงินเข้ากระเป๋าเครดิตของคุณทันทีอัตโนมัติ 100%</span>
              </div>
            </div>
            <Link
              href="/refund"
              className="text-[#7c3aed] font-bold hover:underline whitespace-nowrap shrink-0 self-end sm:self-center"
            >
              อ่านนโยบายฉบับเต็ม &rarr;
            </Link>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 border-t border-[rgba(255,255,255,0.4)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8B7A9E]">
            <p>
              © {new Date().getFullYear()} {name}. All rights reserved. Developed by <span className="text-[#9B6DD5] font-medium">Saint</span>
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-[#2D1B4E] transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-[#2D1B4E] transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link href="/refund" className="hover:text-[#2D1B4E] transition-colors font-semibold text-[#7c3aed]">Refund Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
