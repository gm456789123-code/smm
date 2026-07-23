import Link from 'next/link';
import Image from 'next/image';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';
import {
  BsInstagram, BsTiktok, BsYoutube, BsFacebook,
  BsTwitterX, BsTelegram, BsSpotify,
  BsBoxSeam, BsPeopleFill, BsGlobe2, BsLightningChargeFill,
  BsArrowRight, BsClockHistory,
} from 'react-icons/bs';
import { SiThreads } from 'react-icons/si';
import {
  HeroDashboardCard, HeroStatCounter,
  FeaturesSection, FeaturesTitle, PlatformsTitle, PricingPlans, PricingTitle,
  FaqSection, CtaSection,
} from '@/components/LandingClient';
import { SITE_ICON, SITE_URL } from '@/lib/site';
import { sanitizeUrl } from '@/lib/sanitize-html';

async function getSettings() {
  try {
    const [rows] = await db.query<RowDataPacket[]>('SELECT setting_key, setting_value FROM site_settings');
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
  { name: 'Instagram', icon: BsInstagram, bg: 'bg-gradient-to-br from-pink-600/20 via-purple-600/15 to-[#0B0E1A]', glow: 'rgba(225,48,108,0.25)', iconColor: '#E1306C' },
  { name: 'TikTok', icon: BsTiktok, bg: 'bg-gradient-to-br from-slate-600/20 via-slate-800/15 to-[#0B0E1A]', glow: 'rgba(241,245,249,0.12)', iconColor: '#F1F5F9' },
  { name: 'YouTube', icon: BsYoutube, bg: 'bg-gradient-to-br from-red-600/20 via-red-900/15 to-[#0B0E1A]', glow: 'rgba(255,0,0,0.22)', iconColor: '#FF0000' },
  { name: 'Facebook', icon: BsFacebook, bg: 'bg-gradient-to-br from-blue-600/20 via-blue-900/15 to-[#0B0E1A]', glow: 'rgba(24,119,242,0.22)', iconColor: '#1877F2' },
  { name: 'Twitter/X', icon: BsTwitterX, bg: 'bg-gradient-to-br from-slate-500/15 via-slate-700/10 to-[#0B0E1A]', glow: 'rgba(241,245,249,0.10)', iconColor: '#F1F5F9' },
  { name: 'Telegram', icon: BsTelegram, bg: 'bg-gradient-to-br from-sky-500/20 via-sky-800/15 to-[#0B0E1A]', glow: 'rgba(42,171,238,0.22)', iconColor: '#2AABEE' },
  { name: 'Spotify', icon: BsSpotify, bg: 'bg-gradient-to-br from-green-500/20 via-green-800/15 to-[#0B0E1A]', glow: 'rgba(29,185,84,0.22)', iconColor: '#1DB954' },
  { name: 'Threads', icon: SiThreads, bg: 'bg-gradient-to-br from-slate-500/15 via-slate-700/10 to-[#0B0E1A]', glow: 'rgba(241,245,249,0.10)', iconColor: '#F1F5F9' },
];

const FAQS = [
  { q: 'Is the service safe?', a: 'Yes. We do not ask for passwords and only require public profile or post links.' },
  { q: 'How fast do orders start?', a: 'Most services begin within 0-1 hours after payment, depending on the package.' },
  { q: 'Can I request refill if an order drops?', a: 'Yes. Refill-supported services can be requested from the My Orders page.' },
  { q: 'Can followers drop after purchase?', a: 'Some services include a refill period or guarantee based on the selected package.' },
];

export async function generateMetadata() {
  const s = await getSettings();
  const brand = s.brand_name ?? 'AURA SMM';
  const tagline = s.brand_tagline ?? 'High-quality SMM panel with fast delivery and stable service';
  const desc = s.brand_desc ?? 'Boost followers, likes, views, and engagement across major social platforms.';
  return {
    title: `${brand} - ${tagline}`,
    description: desc,
    alternates: { canonical: SITE_URL },
    openGraph: { url: SITE_URL, title: `${brand} - ${tagline}`, description: desc },
  };
}

export default async function LandingPage() {
  const s = await getSettings();
  const posts = await getLatestPosts();

  const brand = s.brand_name ?? 'AURA SMM';
  const tagline = s.brand_tagline ?? 'High-quality SMM panel with fast delivery and stable service';
  const desc = s.brand_desc ?? 'Boost followers, likes, views, and engagement across major social platforms.';
  const cta = s.hero_cta ?? 'Get started for free';

  // Social URLs from CMS (only active channels)
  const sameAs = (['line', 'facebook', 'telegram', 'discord'] as const)
    .filter((k) => s[`${k}_active`] === '1' && s[`${k}_url`])
    .map((k) => String(s[`${k}_url`]).trim())
    .filter(Boolean);

  const logoAbs = (() => {
    const raw = sanitizeUrl(s.logo_url, 'image');
    if (!raw) return SITE_ICON;
    if (raw.startsWith('http')) return raw;
    if (raw.startsWith('/')) return `${SITE_URL}${raw}`;
    return SITE_ICON;
  })();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: brand,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: logoAbs },
        description: desc,
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: brand,
        description: tagline,
        publisher: { '@id': `${SITE_URL}/#organization` },
        // No SearchAction — blog search is not implemented
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: `${brand} - ${tagline}`,
        description: desc,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL }],
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: FAQS.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/#service`,
        name: `${brand} - SMM Panel`,
        description: desc,
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: { '@type': 'Country', name: 'Thailand' },
        serviceType: 'Social Media Marketing',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'THB',
          lowPrice: '10',
          offerCount: '3',
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="hero-bg hero-grid relative min-h-screen flex items-center px-6 md:px-12 overflow-hidden">
        <div className="hero-light-beam" />
        <div className="hero-grain" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="orb-b absolute -top-20 right-0 w-[560px] h-[560px] bg-[#8B5CF6] opacity-[0.07] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#06B6D4] opacity-[0.05] rounded-full blur-[130px]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#07090F] to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-12 xl:gap-20 items-center py-32 lg:min-h-screen lg:py-0">
          <div className="space-y-8 lg:space-y-9">
            <div className="word-reveal word-reveal-1 flex items-center gap-3">
              <span className="w-5 h-px bg-[#8B5CF6]" />
              <span className="text-[11px] font-bold tracking-[0.22em] text-[#8B5CF6] uppercase">{brand} · SMM Panel</span>
            </div>

            <h1 className="font-[family-name:var(--font-jakarta)] font-black leading-[0.92] tracking-tight">
              <span className="word-reveal word-reveal-1 block text-white text-[3rem] sm:text-[3.8rem] md:text-[4.5rem] lg:text-[5rem]">Grow your</span>
              <span
                className="word-reveal word-reveal-2 block text-[3rem] sm:text-[3.8rem] md:text-[4.5rem] lg:text-[5rem]"
                style={{
                  background: 'linear-gradient(120deg,#8B5CF6 0%,#c4b5fd 50%,#06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                followers
              </span>
              <span className="word-reveal word-reveal-2 block text-[#CBD5E1] text-[2.2rem] sm:text-[2.8rem] md:text-[3.4rem] lg:text-[3.8rem] mt-1">on every platform</span>
            </h1>

            <p className="anim-fade-up anim-fade-up-1 text-base md:text-lg leading-loose max-w-lg text-white font-light">
              SMM Panel จากทีมคนไทย เพิ่มยอดผู้ติดตาม ไลค์ วิว ทุกแพลตฟอร์ม ราคาถูกกว่าตลาด ระบบอัตโนมัติ 24/7 เริ่มต้นแค่ 10 บาท
            </p>

            <div className="anim-fade-up anim-fade-up-2 flex flex-wrap gap-4 items-center">
              <Link href="/register" className="btn-primary text-sm font-bold px-8 py-3.5 inline-flex items-center gap-2">
                {cta} <BsArrowRight size={14} aria-hidden="true" focusable="false" />
              </Link>
              <Link href="/#services" className="text-sm text-[#CBD5E1] hover:text-white transition-colors inline-flex items-center gap-1.5 font-medium">
                View all services <BsArrowRight size={12} aria-hidden="true" focusable="false" />
              </Link>
            </div>

            <div className="anim-fade-up anim-fade-up-3 flex items-center gap-8 pt-5 border-t border-white/[0.05]">
              <HeroStatCounter rawValue={s.stat_orders ?? '50K+'} label="Orders" color="#8B5CF6" />
              <HeroStatCounter rawValue={s.stat_users ?? '10K+'} label="Customers" color="#06B6D4" />
              <div>
                <p className="font-[family-name:var(--font-jakarta)] text-xl font-extrabold tabular-nums" style={{ color: '#10B981' }}>{s.stat_uptime ?? '99.9%'}</p>
                <p className="text-[9px] text-[#94A3B8] uppercase tracking-[0.2em] mt-0.5">Uptime</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block anim-fade-up anim-fade-up-1">
            <HeroDashboardCard />
          </div>
        </div>
      </section>

      <div className="section-divider mx-10" />
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <FeaturesTitle brand={brand} />
          <FeaturesSection />
        </div>
      </section>

      <div className="section-divider mx-10" />
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BsBoxSeam, label: 'Total orders', value: s.stat_orders ?? '50,000+', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.20)' },
            { icon: BsPeopleFill, label: 'Customers', value: s.stat_users ?? '10,000+', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.20)' },
            { icon: BsGlobe2, label: 'Platforms', value: s.stat_platforms ?? '10+', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.20)' },
            { icon: BsLightningChargeFill, label: 'Uptime', value: s.stat_uptime ?? '99.9%', color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.20)' },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className="stat-luxury p-6 text-center" style={{ background: `linear-gradient(135deg, ${bg} 0%, rgba(11,14,26,0.9) 70%)`, borderColor: border }}>
              <div className="flex justify-center mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon size={22} color={color} aria-hidden="true" focusable="false" />
                </div>
              </div>
              <p className="font-[family-name:var(--font-jakarta)] text-3xl font-extrabold" style={{ color }}>{value}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider mx-10" />
      <section id="services" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <PlatformsTitle />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLATFORMS.map(({ name, icon: Icon, bg, glow, iconColor }) => (
              <div key={name} className={`platform-card ${bg} p-6 text-center space-y-3`} style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}>
                <div className="flex justify-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', boxShadow: `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.08)` }}>
                    <Icon size={30} color={iconColor} aria-hidden="true" focusable="false" role="presentation" />
                  </div>
                </div>
                <p className="text-sm font-bold text-[#F1F5F9]">{name}</p>
                <div className="flex justify-center gap-1 flex-wrap">
                  {['Followers', 'Likes', 'Views'].map((t) => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-[#CBD5E1]">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/register" aria-label="Register for an account" className="btn-primary inline-flex items-center gap-2.5 px-8 py-3">
              <span>Register now</span>
              <BsArrowRight size={15} aria-hidden="true" focusable="false" />
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider mx-10" />
      <section id="pricing" className="py-20 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <PricingTitle />
          <PricingPlans />
        </div>
      </section>

      <div className="section-divider mx-10" />
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="section-label text-[#CBD5E1]">FAQ</p>
          </div>
          <FaqSection />
        </div>
      </section>

      {posts.length > 0 && (
        <>
          <div className="section-divider mx-10" />
          <section className="py-20 px-4">
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="flex items-end justify-between">
                <div className="space-y-2">
                  <p className="section-label text-[#06B6D4]">Blog</p>
                  <h2 className="font-[family-name:var(--font-jakarta)] text-3xl font-extrabold text-white">Latest articles</h2>
                </div>
                <Link href="/blog" className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                  View all <BsArrowRight size={12} aria-hidden="true" focusable="false" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {posts.map((post: RowDataPacket) => {
                  const safeCoverImage = sanitizeUrl(post.cover_image, 'image');

                  return (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="luxury-card p-5 space-y-3 group">
                      {safeCoverImage && (
                        <div className="aspect-video rounded-xl overflow-hidden bg-[rgba(139,92,246,0.08)]">
                          <Image
                            src={safeCoverImage}
                            alt={post.title}
                            width={960}
                            height={540}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <p className="font-[family-name:var(--font-jakarta)] font-bold text-[#F1F5F9] text-sm line-clamp-2 group-hover:text-[#c4b5fd] transition-colors">{post.title}</p>
                      {post.excerpt && <p className="text-[#CBD5E1] text-xs line-clamp-2">{post.excerpt}</p>}
                      {post.published_at && (
                        <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8]">
                          <BsClockHistory size={10} aria-hidden="true" focusable="false" />
                          {new Date(post.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="relative py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="orb-a absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#8B5CF6] opacity-[0.09] rounded-full blur-[130px]" />
          <div className="orb-b absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#06B6D4] opacity-[0.07] rounded-full blur-[110px]" />
        </div>
        <div className="section-divider mb-24" />
        <CtaSection cta={cta} />
      </section>
    </>
  );
}
