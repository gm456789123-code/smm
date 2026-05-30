import Link from 'next/link';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import {
  BsInstagram, BsTiktok, BsYoutube, BsFacebook,
  BsTwitterX, BsTelegram, BsSpotify,
  BsBoxSeam, BsPeopleFill, BsGrid, BsLightningChargeFill,
  BsShieldCheckFill, BsArrowRight, BsCheck2Circle,
  BsRocketTakeoffFill, BsStarFill, BsHeadset,
  BsBarChartLineFill, BsCreditCard2BackFill,
  BsQuestionCircle, BsGlobe2, BsClockHistory,
} from 'react-icons/bs';
import { SiThreads } from 'react-icons/si';

async function getSettings() {
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT setting_key, setting_value FROM site_settings');
    return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  } catch { return {} as Record<string, string>; }
}

async function getLatestPosts() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT slug, title, excerpt, cover_image, published_at FROM blog_posts WHERE published = 1 ORDER BY published_at DESC LIMIT 3'
    );
    return rows;
  } catch { return []; }
}

const PLATFORMS = [
  { name: 'Instagram', icon: BsInstagram, bg: 'bg-gradient-to-br from-pink-600/20 via-purple-600/15 to-[#0B0E1A]',  glow: 'rgba(225,48,108,0.25)',  iconColor: '#E1306C' },
  { name: 'TikTok',    icon: BsTiktok,    bg: 'bg-gradient-to-br from-slate-600/20 via-slate-800/15 to-[#0B0E1A]',  glow: 'rgba(241,245,249,0.12)', iconColor: '#F1F5F9' },
  { name: 'YouTube',   icon: BsYoutube,   bg: 'bg-gradient-to-br from-red-600/20 via-red-900/15 to-[#0B0E1A]',      glow: 'rgba(255,0,0,0.22)',     iconColor: '#FF0000' },
  { name: 'Facebook',  icon: BsFacebook,  bg: 'bg-gradient-to-br from-blue-600/20 via-blue-900/15 to-[#0B0E1A]',    glow: 'rgba(24,119,242,0.22)',  iconColor: '#1877F2' },
  { name: 'Twitter/X', icon: BsTwitterX,  bg: 'bg-gradient-to-br from-slate-500/15 via-slate-700/10 to-[#0B0E1A]',  glow: 'rgba(241,245,249,0.10)', iconColor: '#F1F5F9' },
  { name: 'Telegram',  icon: BsTelegram,  bg: 'bg-gradient-to-br from-sky-500/20 via-sky-800/15 to-[#0B0E1A]',      glow: 'rgba(42,171,238,0.22)',  iconColor: '#2AABEE' },
  { name: 'Spotify',   icon: BsSpotify,   bg: 'bg-gradient-to-br from-green-500/20 via-green-800/15 to-[#0B0E1A]',  glow: 'rgba(29,185,84,0.22)',   iconColor: '#1DB954' },
  { name: 'Threads',   icon: SiThreads,   bg: 'bg-gradient-to-br from-slate-500/15 via-slate-700/10 to-[#0B0E1A]',  glow: 'rgba(241,245,249,0.10)', iconColor: '#F1F5F9' },
];

const FEATURES = [
  { icon: BsLightningChargeFill, label: 'เริ่มเร็ว',     desc: 'ออเดอร์เริ่มประมวลผลภายใน 60 วินาที',       color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)' },
  { icon: BsShieldCheckFill,     label: 'ปลอดภัย 100%',  desc: 'ไม่ต้องให้รหัสผ่าน ใช้แค่ลิงก์สาธารณะ',   color: '#10B981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)' },
  { icon: BsBarChartLineFill,    label: 'คุณภาพสูง',     desc: 'follower จริง engagement จริง ไม่ drop',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.25)' },
  { icon: BsHeadset,             label: 'Support 24/7',  desc: 'ทีมงานพร้อมช่วยตลอด ตอบในไม่กี่นาที',     color: '#06B6D4', bg: 'rgba(6,182,212,0.10)',   border: 'rgba(6,182,212,0.25)'  },
  { icon: BsCreditCard2BackFill, label: 'ชำระง่าย',      desc: 'รองรับ PromptPay, บัตร, TrueMoney',        color: '#EC4899', bg: 'rgba(236,72,153,0.10)',  border: 'rgba(236,72,153,0.25)' },
  { icon: BsGlobe2,              label: 'ทุกแพลตฟอร์ม', desc: '10+ แพลตฟอร์ม ครบในที่เดียว',             color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.25)' },
];

const FAQS = [
  { q: 'บริการมีความปลอดภัยมั้ย?',          a: 'ใช้ครับ เราไม่ขอรหัสผ่าน ใช้แค่ลิงก์สาธารณะเท่านั้น' },
  { q: 'เริ่มต้นได้เร็วแค่ไหน?',             a: 'ส่วนใหญ่เริ่มภายใน 0–1 ชั่วโมงหลังชำระเงิน ขึ้นอยู่กับ service' },
  { q: 'ถ้าออเดอร์ไม่ครบ refill ได้มั้ย?',  a: 'ได้ครับ service ที่รองรับ refill สามารถขอได้ผ่านหน้า My Orders' },
  { q: 'ยอด follower จะลดมั้ยหลังซื้อ?',     a: 'Service ของเรามี lifetime guarantee สำหรับบาง service ที่ระบุไว้ชัดเจน' },
];

export default async function LandingPage() {
  const s     = await getSettings();
  const posts = await getLatestPosts();

  const brand   = s.brand_name    ?? 'AURA SMM';
  const tagline = s.brand_tagline ?? 'บริการ SMM Panel คุณภาพสูง เร็ว เสถียร ราคาถูก';
  const cta     = s.hero_cta      ?? 'เริ่มต้นใช้งานฟรี';
  const [brandFirst, ...brandRest] = brand.split(' ');

  return (
    <>
      {/* ══════════════════════════════════════════ HERO */}
      <section className="hero-bg hero-grid relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb-a absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#8B5CF6] opacity-[0.13] rounded-full blur-[140px]" />
          <div className="orb-b absolute top-0 right-0 w-[450px] h-[450px] bg-[#06B6D4] opacity-[0.09] rounded-full blur-[120px]" />
          <div className="orb-c absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-[#7C3AED] opacity-[0.09] rounded-full blur-[110px]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#07090F] to-transparent pointer-events-none" />

        <div className="relative text-center max-w-4xl mx-auto space-y-8 py-24">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 badge-glow px-5 py-2 text-xs font-bold tracking-widest text-[#c4b5fd] uppercase">
            <BsRocketTakeoffFill size={11} className="text-[#8B5CF6]" />
            SMM Panel อันดับ 1 ในไทย
            <BsStarFill size={9} className="text-[#F59E0B]" />
          </div>

          {/* Headline */}
          <h1 className="font-[family-name:var(--font-jakarta)] text-6xl md:text-8xl font-extrabold leading-[1.05] tracking-tight">
            <span className="text-gradient-animated">{brandFirst}</span>
            {brandRest.length > 0 && (
              <span className="text-white drop-shadow-[0_2px_40px_rgba(139,92,246,0.25)]">
                {' '}{brandRest.join(' ')}
              </span>
            )}
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-light">
            {tagline}
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 justify-center pt-1">
            <Link href="/register" className="btn-primary text-base px-9 py-3.5 inline-flex items-center gap-2.5">
              {cta}
              <BsArrowRight size={16} />
            </Link>
            <Link href="/#services" className="btn-secondary text-base px-8 py-3.5 inline-flex items-center gap-2">
              <BsGrid size={14} />
              ดูบริการทั้งหมด
            </Link>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            {[
              { icon: BsBoxSeam,           value: '50K+',  label: 'ออเดอร์',      color: 'text-[#8B5CF6]' },
              { icon: BsPeopleFill,         value: '10K+',  label: 'ลูกค้า',       color: 'text-[#06B6D4]' },
              { icon: BsGlobe2,             value: '10+',   label: 'แพลตฟอร์ม',   color: 'text-violet-400' },
              { icon: BsLightningChargeFill,value: '99.9%', label: 'Uptime',       color: 'text-emerald-400' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Icon size={13} className={color} />
                  <span className={`font-[family-name:var(--font-jakarta)] text-2xl font-extrabold ${color}`}>{value}</span>
                </div>
                <p className="text-[10px] text-[#475569] uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ FEATURES */}
      <div className="section-divider mx-10" />
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="section-label text-[#8B5CF6]">Why Choose Us</p>
            <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-white">
              ทำไมต้องเลือก<span className="text-gradient-animated"> {brand}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, label, desc, color, bg, border }) => (
              <div key={label} className="luxury-card p-6 flex items-start gap-4">
                <div className="icon-box shrink-0" style={{ background: bg, borderColor: border }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p className="font-[family-name:var(--font-jakarta)] font-bold text-[#F1F5F9] text-sm">{label}</p>
                  <p className="text-[#475569] text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ STATS */}
      <div className="section-divider mx-10" />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BsBoxSeam,            label: 'ออเดอร์ที่ผ่านมา', value: s.stat_orders    ?? '50,000+', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.20)' },
            { icon: BsPeopleFill,          label: 'ลูกค้า',            value: s.stat_users     ?? '10,000+', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.20)'  },
            { icon: BsGlobe2,              label: 'แพลตฟอร์ม',         value: s.stat_platforms ?? '10+',     color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.20)'},
            { icon: BsLightningChargeFill, label: 'Uptime',            value: s.stat_uptime    ?? '99.9%',   color: '#10B981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.20)' },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className="stat-luxury p-6 text-center" style={{ background: `linear-gradient(135deg, ${bg} 0%, rgba(11,14,26,0.9) 70%)`, borderColor: border }}>
              <div className="flex justify-center mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon size={22} color={color} />
                </div>
              </div>
              <p className="font-[family-name:var(--font-jakarta)] text-3xl font-extrabold" style={{ color }}>{value}</p>
              <p className="text-[10px] text-[#475569] uppercase tracking-wider mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════ PLATFORMS */}
      <div className="section-divider mx-10" />
      <section id="services" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="section-label text-[#06B6D4]">Platforms</p>
            <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold">
              <span className="text-white">บริการ</span>
              <span className="text-gradient-animated">ของเรา</span>
            </h2>
            <p className="text-[#475569]">รองรับทุกแพลตฟอร์มที่คุณต้องการ</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLATFORMS.map(({ name, icon: Icon, bg, glow, iconColor }) => (
              <div key={name}
                className={`platform-card ${bg} p-6 text-center space-y-3`}
                style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.06)` }}>
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: `rgba(0,0,0,0.3)`, boxShadow: `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.08)` }}>
                    <Icon size={30} color={iconColor} />
                  </div>
                </div>
                <p className="text-sm font-bold text-[#F1F5F9]">{name}</p>
                <div className="flex justify-center gap-1 flex-wrap">
                  {['Followers','Likes','Views'].map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-[#475569]">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/register" className="btn-primary inline-flex items-center gap-2.5 px-8 py-3">
              ดูบริการทั้งหมด <BsArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ PRICING */}
      <div className="section-divider mx-10" />
      <section id="pricing" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <p className="section-label text-[#F59E0B]">Pricing</p>
            <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold">
              <span className="text-white">ราคา</span>
              <span className="text-shimmer">และแพ็กเกจ</span>
            </h2>
            <p className="text-[#475569]">เติมเงินและใช้งานได้ทันที ไม่มีค่าสมัคร</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Starter', price: '฿100', perK: '~฿3/1K', highlight: false, features: ['ทุกบริการพื้นฐาน','ระบบอัตโนมัติ','Support ทาง Chat'] },
              { name: 'Popular', price: '฿500', perK: '~฿2.5/1K', highlight: true,  features: ['ทุกอย่างใน Starter','ราคา Bulk พิเศษ','Priority Support','Refill Guarantee'] },
              { name: 'Pro',     price: '฿2,000', perK: '~฿2/1K', highlight: false, features: ['ทุกอย่างใน Popular','API Access','Account Manager','Custom Services'] },
            ].map(plan => (
              <div key={plan.name}
                className={`luxury-card p-7 space-y-5 ${plan.highlight ? 'ring-1 ring-[rgba(139,92,246,0.50)] shadow-[0_0_50px_rgba(139,92,246,0.15)]' : ''}`}>
                {plan.highlight && (
                  <div className="flex justify-center -mt-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[rgba(139,92,246,0.20)] border border-[rgba(139,92,246,0.45)] text-[#c4b5fd]">
                      <BsStarFill size={9} className="text-[#F59E0B]" /> ยอดนิยม
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <p className="font-[family-name:var(--font-jakarta)] font-extrabold text-white text-lg">{plan.name}</p>
                  <p className={`text-4xl font-extrabold mt-2 font-[family-name:var(--font-jakarta)] ${plan.highlight ? 'text-gradient-animated' : 'text-white'}`}>{plan.price}</p>
                  <p className="text-xs text-[#475569] mt-1">{plan.perK}</p>
                </div>
                <ul className="space-y-2.5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-[#94A3B8]">
                      <BsCheck2Circle size={15} className={plan.highlight ? 'text-[#8B5CF6] shrink-0' : 'text-[#06B6D4] shrink-0'} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${
                    plan.highlight
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}>
                  เริ่มใช้งาน
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ FAQ */}
      <div className="section-divider mx-10" />
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="section-label text-[#94A3B8]">FAQ</p>
            <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-white">
              คำถามที่พบบ่อย
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="luxury-card p-5 space-y-2">
                <div className="flex items-start gap-3">
                  <BsQuestionCircle size={16} className="text-[#8B5CF6] shrink-0 mt-0.5" />
                  <p className="font-semibold text-[#F1F5F9] text-sm">{q}</p>
                </div>
                <p className="text-[#94A3B8] text-sm leading-relaxed pl-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════ BLOG */}
      {posts.length > 0 && (
        <>
          <div className="section-divider mx-10" />
          <section className="py-20 px-4">
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <p className="section-label text-[#06B6D4]">Blog</p>
                  <h2 className="font-[family-name:var(--font-jakarta)] text-3xl font-extrabold text-white">บทความล่าสุด</h2>
                </div>
                <Link href="/blog" className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                  ดูทั้งหมด <BsArrowRight size={12} />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {posts.map((post: RowDataPacket) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="luxury-card p-5 space-y-3 group">
                    {post.cover_image && (
                      <div className="aspect-video rounded-xl overflow-hidden bg-[rgba(139,92,246,0.08)]">
                        <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <p className="font-[family-name:var(--font-jakarta)] font-bold text-[#F1F5F9] text-sm line-clamp-2 group-hover:text-[#c4b5fd] transition-colors">{post.title}</p>
                    {post.excerpt && <p className="text-[#475569] text-xs line-clamp-2">{post.excerpt}</p>}
                    {post.published_at && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#334155]">
                        <BsClockHistory size={10} />
                        {new Date(post.published_at).toLocaleDateString('th-TH', { year:'numeric', month:'short', day:'numeric' })}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ══════════════════════════════════════════ CTA BOTTOM */}
      <section className="relative py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb-a absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#8B5CF6] opacity-[0.09] rounded-full blur-[130px]" />
          <div className="orb-b absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#06B6D4] opacity-[0.07] rounded-full blur-[110px]" />
        </div>
        <div className="section-divider mb-24" />
        <div className="relative max-w-2xl mx-auto space-y-7">
          <div className="flex justify-center">
            <div className="badge-glow inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest text-[#c4b5fd] uppercase">
              <BsRocketTakeoffFill size={11} /> พร้อมเริ่มแล้วหรือยัง?
            </div>
          </div>
          <h2 className="font-[family-name:var(--font-jakarta)] text-5xl md:text-6xl font-extrabold">
            <span className="text-white">เพิ่มยอดของคุณ</span><br />
            <span className="text-gradient-animated">วันนี้เลย</span>
          </h2>
          <p className="text-[#94A3B8] text-lg">สมัครฟรี ไม่มีค่าใช้จ่ายแรกเข้า เติมเงินแล้วใช้งานได้เลย</p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Link href="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2.5">
              {cta} <BsArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-4">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </section>
    </>
  );
}
