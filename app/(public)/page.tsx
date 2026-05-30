import Link from 'next/link';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import {
  BsInstagram, BsTiktok, BsYoutube, BsFacebook,
  BsTwitterX, BsTelegram, BsSpotify,
} from 'react-icons/bs';
import { SiThreads } from 'react-icons/si';

async function getSettings() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT setting_key, setting_value FROM site_settings'
    );
    return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  } catch {
    return {} as Record<string, string>;
  }
}

async function getLatestPosts() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT slug, title, excerpt, cover_image, published_at FROM blog_posts WHERE published = 1 ORDER BY published_at DESC LIMIT 3'
    );
    return rows;
  } catch {
    return [];
  }
}

const PLATFORMS = [
  { name: 'Instagram', icon: BsInstagram,  color: 'from-pink-500/15 to-purple-600/15',  border: 'border-pink-500/25',   iconColor: '#E1306C' },
  { name: 'TikTok',    icon: BsTiktok,     color: 'from-slate-800/40 to-slate-900/40',  border: 'border-slate-400/20',  iconColor: '#F1F5F9' },
  { name: 'YouTube',   icon: BsYoutube,    color: 'from-red-600/15 to-red-800/15',      border: 'border-red-500/25',    iconColor: '#FF0000' },
  { name: 'Facebook',  icon: BsFacebook,   color: 'from-blue-600/15 to-blue-800/15',    border: 'border-blue-500/25',   iconColor: '#1877F2' },
  { name: 'Twitter/X', icon: BsTwitterX,   color: 'from-slate-700/20 to-slate-900/20',  border: 'border-slate-400/20',  iconColor: '#F1F5F9' },
  { name: 'Telegram',  icon: BsTelegram,   color: 'from-sky-500/15 to-sky-700/15',      border: 'border-sky-400/25',    iconColor: '#2AABEE' },
  { name: 'Spotify',   icon: BsSpotify,    color: 'from-green-600/15 to-green-800/15',  border: 'border-green-500/25',  iconColor: '#1DB954' },
  { name: 'Threads',   icon: SiThreads,    color: 'from-slate-600/20 to-slate-800/20',  border: 'border-slate-500/20',  iconColor: '#F1F5F9' },
];

const FAQS = [
  { q: 'บริการมีความปลอดภัยมั้ย?', a: 'ใช้ครับ เราไม่ขอรหัสผ่าน ใช้แค่ลิงก์สาธารณะเท่านั้น' },
  { q: 'เริ่มต้นได้เร็วแค่ไหน?', a: 'ส่วนใหญ่เริ่มภายใน 0–1 ชั่วโมงหลังชำระเงิน ขึ้นอยู่กับ service' },
  { q: 'ถ้าออเดอร์ไม่ครบสามารถ refill ได้มั้ย?', a: 'ได้ครับ service ที่รองรับ refill สามารถขอได้ผ่านหน้า My Orders' },
  { q: 'ยอด follower จะลดมั้ยหลังจากซื้อ?', a: 'Service ของเรามี lifetime guarantee สำหรับบาง service ที่ระบุไว้ชัดเจน' },
];

export default async function LandingPage() {
  const s = await getSettings();
  const posts = await getLatestPosts();

  const brand   = s.brand_name    ?? 'AURA SMM';
  const tagline = s.brand_tagline ?? 'บริการ SMM Panel คุณภาพสูง เร็ว เสถียร ราคาถูก';
  const desc    = s.brand_desc    ?? 'เพิ่มยอดผู้ติดตาม ยอดไลค์ และ engagement บนทุกแพลตฟอร์ม';
  const cta     = s.hero_cta      ?? 'เริ่มต้นใช้งานฟรี';

  const [brandFirst, ...brandRest] = brand.split(' ');

  return (
    <>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="hero-bg hero-grid relative min-h-[92vh] flex items-center justify-center px-4 overflow-hidden">

        {/* Animated orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb-1 absolute -top-20 -left-20 w-[500px] h-[500px] bg-[#8B5CF6] opacity-[0.12] rounded-full blur-[120px]" />
          <div className="orb-2 absolute top-10 right-0 w-[400px] h-[400px] bg-[#06B6D4] opacity-[0.10] rounded-full blur-[100px]" />
          <div className="orb-3 absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-[#7C3AED] opacity-[0.10] rounded-full blur-[90px]" />
          <div className="orb-1 absolute bottom-10 right-10 w-[250px] h-[250px] bg-[#06B6D4] opacity-[0.08] rounded-full blur-[80px]" />
        </div>

        {/* Horizontal glow line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent pointer-events-none" />

        <div className="relative text-center max-w-4xl mx-auto space-y-7 py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 badge-glow px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#c4b5fd]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] inline-block animate-pulse" />
            🚀 SMM Panel อันดับ 1 ในไทย
          </div>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-jakarta)] text-6xl md:text-8xl font-extrabold leading-none tracking-tight">
            <span className="text-gradient-animated">{brandFirst}</span>
            {brandRest.length > 0 && (
              <span className="text-white drop-shadow-[0_0_40px_rgba(139,92,246,0.3)]"> {brandRest.join(' ')}</span>
            )}
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-light">
            {tagline}
          </p>
          <p className="text-[#475569] text-base">{desc}</p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link href="/register" className="btn-primary text-base">
              {cta} →
            </Link>
            <Link href="/#services" className="btn-secondary text-base">
              ดูบริการทั้งหมด
            </Link>
          </div>

          {/* Mini stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {[
              { value: '50K+', label: 'ออเดอร์', color: 'text-[#8B5CF6]' },
              { value: '10K+', label: 'ลูกค้า',  color: 'text-[#06B6D4]' },
              { value: '10+',  label: 'แพลตฟอร์ม', color: 'text-violet-400' },
              { value: '99.9%',label: 'Uptime',  color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className={`font-[family-name:var(--font-inter)] text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-[#475569] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#090D16] to-transparent pointer-events-none" />
      </section>

      {/* ── Stats ────────────────────────────────────── */}
      <div className="section-divider mx-8" />
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'ออเดอร์ที่ผ่านมา', value: s.stat_orders    ?? '50,000+', icon: '📦', color: 'text-[#8B5CF6]', bg: 'from-[#8B5CF6]/10 to-transparent', border: 'border-[#8B5CF6]/20' },
            { label: 'ลูกค้า',            value: s.stat_users     ?? '10,000+', icon: '👥', color: 'text-[#06B6D4]', bg: 'from-[#06B6D4]/10 to-transparent', border: 'border-[#06B6D4]/20' },
            { label: 'แพลตฟอร์ม',         value: s.stat_platforms ?? '10+',     icon: '🌐', color: 'text-violet-400', bg: 'from-violet-500/10 to-transparent', border: 'border-violet-500/20' },
            { label: 'Uptime',            value: s.stat_uptime    ?? '99.9%',   icon: '⚡', color: 'text-emerald-400', bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/20' },
          ].map((stat) => (
            <div key={stat.label} className={`glow-card bg-gradient-to-br ${stat.bg} border ${stat.border} p-6 text-center group hover:scale-[1.03] transition-transform duration-200`}>
              <div className="text-3xl mb-3">{stat.icon}</div>
              <p className={`font-[family-name:var(--font-jakarta)] text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-[#475569] mt-1.5 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ─────────────────────────────────── */}
      <div className="section-divider mx-8" />
      <section id="services" className="py-16 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs text-[#8B5CF6] uppercase tracking-[0.3em] font-semibold">Platforms</p>
            <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-white">
              บริการ<span className="text-gradient-animated">ของเรา</span>
            </h2>
            <p className="text-[#475569]">รองรับทุกแพลตฟอร์มที่คุณต้องการ</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.name}
                  className={`glass-tab bg-gradient-to-br ${p.color} border ${p.border} p-5 text-center space-y-3 hover:scale-[1.03] transition-transform duration-200`}>
                  <div className="flex justify-center">
                    <Icon size={36} color={p.iconColor} />
                  </div>
                  <p className="text-sm font-semibold text-[#F1F5F9]">{p.name}</p>
                  <p className="text-[10px] text-[#475569]">Followers · Likes · Views</p>
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <Link href="/register"
              className="glass-tab glass-tab-active inline-block px-8 py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white">
              ดูบริการทั้งหมด →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <div className="section-divider mx-8" />
      <section id="pricing" className="py-16 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-xs text-[#06B6D4] uppercase tracking-[0.3em] font-semibold">Pricing</p>
            <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold">
              <span className="text-white">ราคา</span><span className="text-shimmer">และแพ็กเกจ</span>
            </h2>
            <p className="text-[#475569]">เติมเงินและใช้งานได้ทันที ไม่มีค่าสมัคร</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: 'Starter',  price: '฿100', perK: '~฿3/1K', features: ['ทุกบริการพื้นฐาน', 'ระบบอัตโนมัติ', 'Support ทาง Chat'], highlight: false },
              { name: 'Popular',  price: '฿500', perK: '~฿2.5/1K', features: ['ทุกอย่างใน Starter', 'ราคาพิเศษ bulk', 'Priority support', 'Refill guarantee'], highlight: true },
              { name: 'Pro',      price: '฿2,000', perK: '~฿2/1K', features: ['ทุกอย่างใน Popular', 'API access', 'Account manager', 'Custom services'], highlight: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`glass p-6 space-y-4 ${plan.highlight ? 'border-[rgba(139,92,246,0.45)] shadow-[0_0_30px_rgba(139,92,246,0.15)]' : ''}`}>
                {plan.highlight && (
                  <div className="text-center">
                    <span className="text-[10px] bg-[rgba(139,92,246,0.2)] border border-[rgba(139,92,246,0.4)] text-[#c4b5fd] px-3 py-1 rounded-full uppercase tracking-wider">
                      ยอดนิยม
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <p className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-white">{plan.name}</p>
                  <p className="text-3xl font-bold text-[#8B5CF6] mt-1">{plan.price}</p>
                  <p className="text-xs text-[#475569]">{plan.perK}</p>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                      <span className="text-[#06B6D4]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`glass-tab block text-center py-2.5 text-sm font-semibold transition-colors ${plan.highlight ? 'glass-tab-active text-[#c4b5fd] hover:text-white' : 'text-[#94A3B8] hover:text-[#F1F5F9]'}`}>
                  เริ่มใช้งาน
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-white">คำถามที่พบบ่อย</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="glass p-5 space-y-2">
                <p className="font-semibold text-[#F1F5F9] text-sm">{q}</p>
                <p className="text-[#94A3B8] text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog preview ─────────────────────────────── */}
      {posts.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-jakarta)] text-3xl font-bold text-white">บทความล่าสุด</h2>
              <Link href="/blog" className="text-sm text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">ดูทั้งหมด →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {posts.map((post: RowDataPacket) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="glass p-5 space-y-3 group hover:border-[rgba(139,92,246,0.3)] transition-colors">
                  {post.cover_image && (
                    <div className="aspect-video bg-[rgba(139,92,246,0.1)] rounded-lg overflow-hidden">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h3 className="font-semibold text-[#F1F5F9] text-sm group-hover:text-[#c4b5fd] transition-colors line-clamp-2">{post.title}</h3>
                  {post.excerpt && <p className="text-[#475569] text-xs line-clamp-2">{post.excerpt}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA bottom ───────────────────────────────── */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb-1 absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#8B5CF6] opacity-[0.10] rounded-full blur-[100px]" />
          <div className="orb-2 absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-[#06B6D4] opacity-[0.08] rounded-full blur-[90px]" />
        </div>
        <div className="section-divider mb-20" />
        <div className="relative max-w-2xl mx-auto space-y-6">
          <p className="text-xs text-[#8B5CF6] uppercase tracking-[0.3em] font-semibold">Get Started</p>
          <h2 className="font-[family-name:var(--font-jakarta)] text-5xl font-extrabold">
            <span className="text-white">พร้อมเริ่มแล้ว</span>
            <span className="text-gradient-animated">ใช่มั้ย?</span>
          </h2>
          <p className="text-[#94A3B8] text-lg">สมัครฟรี ไม่มีค่าใช้จ่ายแรกเข้า เติมเงินแล้วใช้งานได้เลย</p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link href="/register" className="btn-primary text-base px-10 py-4">
              {cta} →
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-4">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
