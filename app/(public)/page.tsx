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
  { name: 'Instagram', icon: BsInstagram, iconColor: '#E1306C', orb: 'rgba(225,48,108,0.15)' },
  { name: 'TikTok',    icon: BsTiktok,    iconColor: '#2D1B4E', orb: 'rgba(45,27,78,0.12)'   },
  { name: 'YouTube',   icon: BsYoutube,   iconColor: '#FF0000', orb: 'rgba(255,0,0,0.12)'     },
  { name: 'Facebook',  icon: BsFacebook,  iconColor: '#1877F2', orb: 'rgba(24,119,242,0.15)'  },
  { name: 'Twitter/X', icon: BsTwitterX,  iconColor: '#2D1B4E', orb: 'rgba(45,27,78,0.10)'   },
  { name: 'Telegram',  icon: BsTelegram,  iconColor: '#2AABEE', orb: 'rgba(42,171,238,0.15)'  },
  { name: 'Spotify',   icon: BsSpotify,   iconColor: '#1DB954', orb: 'rgba(29,185,84,0.15)'   },
  { name: 'Threads',   icon: SiThreads,   iconColor: '#2D1B4E', orb: 'rgba(45,27,78,0.10)'   },
];

const FAQS = [
  { q: 'Is the service safe?', a: 'Yes. We do not ask for passwords and only require public profile or post links.' },
  { q: 'How fast do orders start?', a: 'Most services begin within 0–1 hours after payment, depending on the package.' },
  { q: 'Can I request refill if an order drops?', a: 'Yes. Refill-supported services can be requested from the My Orders page.' },
  { q: 'Can followers drop after purchase?', a: 'Some services include a refill period or guarantee based on the selected package.' },
];

export async function generateMetadata() {
  const s       = await getSettings();
  const brand   = s.brand_name    ?? 'AURA SMM';
  const tagline = s.brand_tagline ?? 'High-quality SMM panel with fast delivery and stable service';
  const desc    = s.brand_desc    ?? 'Boost followers, likes, views, and engagement across major social platforms.';
  return {
    title: `${brand} - ${tagline}`,
    description: desc,
    alternates: { canonical: SITE_URL },
    openGraph: { url: SITE_URL, title: `${brand} - ${tagline}`, description: desc },
  };
}

export default async function LandingPage() {
  const s     = await getSettings();
  const posts = await getLatestPosts();

  const brand   = s.brand_name    ?? 'AURA SMM';
  const tagline = s.brand_tagline ?? 'High-quality SMM panel with fast delivery and stable service';
  const desc    = s.brand_desc    ?? 'Boost followers, likes, views, and engagement across major social platforms.';
  const cta     = s.hero_cta      ?? 'Get started for free';

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
        '@type': 'Organization', '@id': `${SITE_URL}/#organization`,
        name: brand, url: SITE_URL,
        logo: { '@type': 'ImageObject', url: logoAbs }, description: desc,
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: brand, description: tagline, publisher: { '@id': `${SITE_URL}/#organization` } },
      {
        '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: SITE_URL,
        name: `${brand} - ${tagline}`, description: desc,
        isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': `${SITE_URL}/#organization` },
        breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL }] },
      },
      { '@type': 'FAQPage', '@id': `${SITE_URL}/#faq`, mainEntity: FAQS.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      {
        '@type': 'Service', '@id': `${SITE_URL}/#service`,
        name: `${brand} - SMM Panel`, description: desc,
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: { '@type': 'Country', name: 'Thailand' },
        serviceType: 'Social Media Marketing',
        offers: { '@type': 'AggregateOffer', priceCurrency: 'THB', lowPrice: '10', offerCount: '3' },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[calc(100vh-6rem)] flex items-center px-6 md:px-12 overflow-hidden">
        {/* Floating pastel orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="pg-orb-a absolute -top-24 -left-16 w-[480px] h-[480px] rounded-full blur-[120px]" style={{ background: 'rgba(201,177,232,0.55)' }} />
          <div className="pg-orb-b absolute top-1/4 right-0 w-[420px] h-[420px] rounded-full blur-[110px]" style={{ background: 'rgba(245,198,208,0.50)' }} />
          <div className="pg-orb-c absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full blur-[100px]" style={{ background: 'rgba(184,224,210,0.45)' }} />
          <div className="pg-orb-d absolute -bottom-10 right-1/4 w-[300px] h-[300px] rounded-full blur-[90px]" style={{ background: 'rgba(248,213,194,0.45)' }} />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-12 xl:gap-20 items-center py-16 lg:py-0 lg:min-h-[calc(100vh-6rem)]">
          <div className="space-y-8">
            {/* Brand pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase text-[#6D3BAF]"
              style={{ background: 'rgba(201,177,232,0.35)', border: '1px solid rgba(201,177,232,0.55)' }}>
              ✦ {brand} · SMM Panel
            </div>

            {/* Headline */}
            <h1 className="font-extrabold leading-[1.08] tracking-tight text-[#2D1B4E] text-[3rem] sm:text-[3.8rem] md:text-[4.4rem] lg:text-[4.8rem]">
              Grow your<br />
              <span className="pg-text-gradient">followers</span><br />
              <span className="text-[#4A3B63] text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] lg:text-[3.6rem]">on every platform</span>
            </h1>

            <p className="text-base md:text-lg leading-loose max-w-lg text-[#4A3B63]">
              SMM Panel จากทีมคนไทย เพิ่มยอดผู้ติดตาม ไลค์ วิว ทุกแพลตฟอร์ม ราคาถูกกว่าตลาด ระบบอัตโนมัติ 24/7 เริ่มต้นแค่ 10 บาท
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Link href="/register" className="pg-btn-primary px-8 py-3.5 text-sm">
                {cta} <BsArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link href="/#services" className="pg-btn-outline px-6 py-3.5 text-sm">
                View all services <BsArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-5 border-t border-white/30">
              <HeroStatCounter rawValue={s.stat_orders ?? '50K+'} label="Orders"    color="#6D3BAF" />
              <HeroStatCounter rawValue={s.stat_users  ?? '10K+'} label="Customers" color="#6D3BAF" />
              <div>
                <p className="font-bold text-xl tabular-nums text-[#6D3BAF]">{s.stat_uptime ?? '99.9%'}</p>
                <p className="pg-label mt-0.5">Uptime</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroDashboardCard />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <FeaturesTitle brand={brand} />
          <FeaturesSection />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BsBoxSeam,             label: 'Total orders', value: s.stat_orders    ?? '50,000+', color: '#9B6DD5' },
            { icon: BsPeopleFill,          label: 'Customers',    value: s.stat_users     ?? '10,000+', color: '#E88FAA' },
            { icon: BsGlobe2,              label: 'Platforms',    value: s.stat_platforms ?? '10+',     color: '#6BAED6' },
            { icon: BsLightningChargeFill, label: 'Uptime',       value: s.stat_uptime    ?? '99.9%',   color: '#6DB89A' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="pg-stat p-6 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                  <Icon size={22} color={color} aria-hidden="true" focusable="false" />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="pg-label mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Platforms ────────────────────────────────────────── */}
      <section id="services" className="py-20 px-4 scroll-mt-24">
        <div className="max-w-5xl mx-auto space-y-12">
          <PlatformsTitle />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLATFORMS.map(({ name, icon: Icon, iconColor, orb }) => (
              <div key={name} className="pg-platform-card p-6 text-center space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 rounded-[20px] pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${orb} 0%, transparent 70%)` }} />
                <div className="relative flex justify-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/40 border border-white/50">
                    <Icon size={26} color={iconColor} aria-hidden="true" focusable="false" role="presentation" />
                  </div>
                </div>
                <p className="relative text-sm font-semibold text-[#2D1B4E]">{name}</p>
                <div className="relative flex justify-center gap-1 flex-wrap">
                  {['Followers', 'Likes', 'Views'].map((tag) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/40 text-[#4A3B63] border border-white/40">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/register" className="pg-btn-primary px-8 py-3.5">
              Register now <BsArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 scroll-mt-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <PricingTitle />
          <PricingPlans />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="pg-label">FAQ</p>
            <h2 className="font-extrabold text-4xl text-[#2D1B4E] leading-tight">Common questions</h2>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <p className="pg-label">Blog</p>
                <h2 className="font-extrabold text-3xl text-[#2D1B4E]">Latest articles</h2>
              </div>
              <Link href="/blog" className="pg-btn-outline text-xs px-4 py-2 inline-flex items-center gap-1.5">
                View all <BsArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {posts.map((post: RowDataPacket) => {
                const safeCoverImage = sanitizeUrl(post.cover_image, 'image');
                return (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="pg-blog-card p-5 space-y-3 group">
                    {safeCoverImage && (
                      <div className="aspect-video rounded-2xl overflow-hidden bg-white/25">
                        <Image
                          src={safeCoverImage}
                          alt={post.title}
                          width={960} height={540}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <p className="font-semibold text-[#2D1B4E] text-sm line-clamp-2 group-hover:text-[#9B6DD5] transition-colors">
                      {post.title}
                    </p>
                    {post.excerpt && <p className="text-[#4A3B63] text-xs line-clamp-2">{post.excerpt}</p>}
                    {post.published_at && (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8B7A9E]">
                        <BsClockHistory size={10} aria-hidden="true" />
                        {new Date(post.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="pg-orb-a absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[110px]" style={{ background: 'rgba(201,177,232,0.50)' }} />
          <div className="pg-orb-b absolute bottom-0 right-1/4 w-[360px] h-[360px] rounded-full blur-[100px]" style={{ background: 'rgba(245,198,208,0.45)' }} />
        </div>
        <CtaSection cta={cta} />
      </section>
    </>
  );
}
