'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from './LocaleProvider';
import {
  BsBoxSeam, BsPeopleFill, BsGlobe2, BsLightningChargeFill,
  BsShieldCheck, BsArrowRight, BsCheck2Circle,
  BsRocketTakeoffFill, BsStarFill, BsHeadset,
  BsBarChartLineFill, BsCreditCard2BackFill, BsQuestionCircle,
  BsInstagram, BsTiktok, BsYoutube, BsFacebook,
} from 'react-icons/bs';

export function HeroStatCounter({ rawValue, label, color }: { rawValue: string; label: string; color: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hasK = /k/i.test(rawValue.replace(/[+,]/g, ''));
    const target = parseFloat(rawValue.replace(/[+,k\s]/gi, '')) * (hasK ? 1000 : 1);
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const frames = 90;
      let frame = 0;
      const timer = setInterval(() => {
        frame++;
        const progress = 1 - Math.pow(1 - frame / frames, 3);
        setCount(Math.round(progress * target));
        if (frame >= frames) clearInterval(timer);
      }, 16);
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rawValue]);

  const hasK = /k/i.test(rawValue.replace(/[+,]/g, ''));
  const display = hasK ? `${Math.round(count / 1000)}K` : count.toLocaleString();

  return (
    <div ref={ref}>
      <p className="font-[family-name:var(--font-jakarta)] text-xl font-extrabold tabular-nums" style={{ color }}>
        {display}{rawValue.includes('+') ? '+' : ''}
      </p>
      <p className="text-[9px] text-[#94A3B8] uppercase tracking-[0.2em] mt-0.5">{label}</p>
    </div>
  );
}

const LIVE_ORDERS = [
  { Icon: BsInstagram, platform: 'Instagram', service: 'Followers - TH', pct: 78, color: '#E1306C', done: false },
  { Icon: BsTiktok, platform: 'TikTok', service: 'Video Views', pct: 100, color: '#F1F5F9', done: true },
  { Icon: BsYoutube, platform: 'YouTube', service: 'Watch Hours', pct: 41, color: '#FF0000', done: false },
  { Icon: BsFacebook, platform: 'Facebook', service: 'Page Likes', pct: 62, color: '#1877F2', done: false },
];

export function HeroDashboardCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-[#8B5CF6]/[0.06] rounded-3xl blur-3xl pointer-events-none" />
      <div
        className="relative rounded-2xl overflow-hidden border border-white/[0.07]"
        style={{ background: 'rgba(8,10,18,0.97)', backdropFilter: 'blur(24px)' }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-semibold text-[#CBD5E1] tracking-wide">Live Orders</span>
          </div>
          <span className="text-[10px] text-[#94A3B8] font-mono tabular-nums">Updated 2s ago</span>
        </div>

        {LIVE_ORDERS.map(({ Icon, platform, service, pct, color, done }) => (
          <div key={platform} className="flex items-center gap-3.5 px-5 py-3 border-b border-white/[0.04] last:border-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}18`, border: `1px solid ${color}28` }}
            >
              <Icon size={15} color={color} aria-hidden="true" focusable="false" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-[#CBD5E1] truncate">{service}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                    done ? 'bg-[rgba(16,185,129,0.12)] text-[#10B981]' : 'bg-[rgba(139,92,246,0.10)] text-[#a78bfa]'
                  }`}
                >
                  {done ? 'Done' : 'Running'}
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: done
                      ? 'linear-gradient(90deg,#10B981,#34D399)'
                      : `linear-gradient(90deg,${color}88,${color})`,
                  }}
                />
              </div>
              <p className="text-[9px] text-[#94A3B8] mt-1 font-mono">{platform} - {pct}%</p>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-2 divide-x divide-white/[0.05] border-t border-white/[0.06]">
          <div className="px-5 py-3 text-center">
            <p className="font-[family-name:var(--font-jakarta)] text-lg font-extrabold text-white">127</p>
            <p className="text-[9px] text-[#94A3B8] uppercase tracking-wider mt-0.5">orders today</p>
          </div>
          <div className="px-5 py-3 text-center">
            <p className="font-[family-name:var(--font-jakarta)] text-lg font-extrabold text-[#10B981]">THB 0.001</p>
            <p className="text-[9px] text-[#94A3B8] uppercase tracking-wider mt-0.5">per follower</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroBadge() {
  const { t } = useLocale();
  return (
    <div className="anim-fade-up inline-flex items-center gap-2.5 badge-glow px-5 py-2 text-xs font-bold tracking-widest text-[#c4b5fd] uppercase">
      <BsRocketTakeoffFill size={11} className="text-[#8B5CF6]" />
      {t('hero.badge')}
      <BsStarFill size={9} className="text-[#F59E0B]" />
    </div>
  );
}

export function HeroText({ brand }: { brand: string }) {
  const { t } = useLocale();
  void brand;
  const tagline = t('hero.tagline');
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const delay = setTimeout(() => {
      let i = 0;
      const id = setInterval(() => {
        i++;
        setDisplayed(tagline.slice(0, i));
        if (i >= tagline.length) {
          setDone(true);
          clearInterval(id);
        }
      }, 40);
      return () => clearInterval(id);
    }, 500);
    return () => clearTimeout(delay);
  }, [tagline]);

  return (
    <>
      <p className="anim-fade-up anim-fade-up-1 text-lg md:text-xl text-[#CBD5E1] font-mono tracking-wide min-h-[1.6em] max-w-2xl mx-auto">
        {displayed}
        {!done && <span className="cursor-blink" />}
      </p>
      <p
        className="anim-fade-up anim-fade-up-2 text-[#CBD5E1] text-sm"
        style={{ opacity: done ? 1 : 0, transition: 'opacity 0.7s ease' }}
      >
        {t('hero.desc')}
      </p>
      <div className="anim-fade-up anim-fade-up-3 flex flex-wrap gap-4 justify-center pt-1">
        <Link href="/register" className="btn-primary text-base px-9 py-3.5 inline-flex items-center gap-2.5">
          {t('hero.cta')} <BsArrowRight size={16} />
        </Link>
        <Link href="/#services" className="btn-secondary text-base px-8 py-3.5 inline-flex items-center gap-2">
          <BsGlobe2 size={14} />
          {t('hero.viewServices')}
        </Link>
      </div>
    </>
  );
}

export function HeroStats() {
  const { t } = useLocale();
  const stats = [
    { icon: BsBoxSeam, value: '50K+', key: 'hero.stats.orders', color: '#8B5CF6' },
    { icon: BsPeopleFill, value: '10K+', key: 'hero.stats.users', color: '#06B6D4' },
    { icon: BsGlobe2, value: '10+', key: 'hero.stats.platforms', color: '#a78bfa' },
    { icon: BsLightningChargeFill, value: '99.9%', key: 'hero.stats.uptime', color: '#10B981' },
  ];

  return (
    <div className="flex items-center justify-center pt-8 mt-2 border-t border-white/[0.06]">
      {stats.map(({ icon: Icon, value, key, color }, i) => (
        <div key={key} className="flex items-center">
          {i > 0 && <div className="w-px h-9 bg-white/[0.07] mx-5 md:mx-9 shrink-0" />}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Icon size={12} style={{ color }} />
              <span className="font-[family-name:var(--font-jakarta)] text-xl md:text-2xl font-extrabold" style={{ color }}>
                {value}
              </span>
            </div>
            <p className="text-[9px] text-[#94A3B8] uppercase tracking-[0.18em]">{t(key)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeaturesSection() {
  const { t } = useLocale();
  const features = [
    { icon: BsLightningChargeFill, key: 'features.fast', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
    { icon: BsShieldCheck, key: 'features.safe', color: '#10B981', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' },
    { icon: BsBarChartLineFill, key: 'features.quality', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)' },
    { icon: BsHeadset, key: 'features.support', color: '#06B6D4', bg: 'rgba(6,182,212,0.10)', border: 'rgba(6,182,212,0.25)' },
    { icon: BsCreditCard2BackFill, key: 'features.payment', color: '#EC4899', bg: 'rgba(236,72,153,0.10)', border: 'rgba(236,72,153,0.25)' },
    { icon: BsGlobe2, key: 'features.global', color: '#6366F1', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.25)' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {features.map(({ icon: Icon, key, color, bg, border }) => (
        <div key={key} className="luxury-card p-6 flex items-start gap-4">
          <div className="icon-box shrink-0" style={{ background: bg, borderColor: border }}>
            <Icon size={20} color={color} aria-hidden="true" focusable="false" />
          </div>
          <div>
            <p className="font-[family-name:var(--font-jakarta)] font-bold text-[#F1F5F9] text-sm">{t(`${key}.label`)}</p>
            <p className="text-[#CBD5E1] text-xs mt-1 leading-relaxed">{t(`${key}.desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeaturesTitle({ brand }: { brand: string }) {
  const { t } = useLocale();
  return (
    <div className="text-center space-y-3">
      <p className="section-label text-[#8B5CF6]">Why Choose Us</p>
      <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-white">
        {t('features.title')}
        <span className="text-gradient-animated"> {brand}</span>
      </h2>
    </div>
  );
}

export function PlatformsTitle() {
  const { t } = useLocale();
  return (
    <div className="text-center space-y-3">
      <p className="section-label text-[#06B6D4]">Platforms</p>
      <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-white">{t('platforms.title')}</h2>
      <p className="text-[#CBD5E1]">{t('platforms.subtitle')}</p>
    </div>
  );
}

export function PricingTitle() {
  const { t } = useLocale();
  const title = t('pricing.title');
  const parts = title.split('&');
  return (
    <div className="text-center space-y-3">
      <p className="section-label text-[#F59E0B]">Pricing</p>
      <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold text-white">
        {parts.length > 1 ? (
          <>
            {parts[0].trim()}
            <span className="text-shimmer">&nbsp;&amp; {parts.slice(1).join('&').trim()}</span>
          </>
        ) : (
          <span className="text-shimmer">{title}</span>
        )}
      </h2>
      <p className="text-[#CBD5E1] text-sm">{t('pricing.subtitle')}</p>
    </div>
  );
}

export function PricingPlans() {
  const { t } = useLocale();

  const plans = [
    { name: 'Starter', price: 'THB 100', highlight: false },
    { name: 'Popular', price: 'THB 500', highlight: true },
    { name: 'Pro', price: 'THB 2,000', highlight: false },
  ];

  type CellVal = boolean | string;
  const rows: { label: string; values: CellVal[] }[] = [
    { label: 'Minimum top-up', values: ['THB 100', 'THB 500', 'THB 2,000'] },
    { label: 'Price / 1,000', values: ['~THB 3', '~THB 2.5', '~THB 2'] },
    { label: t('pricing.features.allBasic'), values: [true, true, true] },
    { label: t('pricing.features.autoSystem'), values: [true, true, true] },
    { label: 'Support', values: ['Chat', 'Priority', 'Dedicated'] },
    { label: t('pricing.features.bulkPrice'), values: [false, true, true] },
    { label: t('pricing.features.refillGuarantee'), values: [false, true, true] },
    { label: t('pricing.features.apiAccess'), values: [false, false, true] },
    { label: t('pricing.features.customServices'), values: [false, false, true] },
  ];

  const grid = { display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr' };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(11,14,26,0.85)' }}>
        <div style={grid}>
          <div className="p-5 border-b border-white/5" />
          {plans.map((plan) => (
            <div key={plan.name} className={`p-5 text-center border-b border-l border-white/5 ${plan.highlight ? 'bg-[rgba(139,92,246,0.07)]' : ''}`}>
              {plan.highlight && (
                <div className="flex justify-center mb-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[rgba(139,92,246,0.20)] border border-[rgba(139,92,246,0.45)] text-[#c4b5fd]">
                    <BsStarFill size={8} className="text-[#F59E0B]" /> {t('pricing.popular')}
                  </span>
                </div>
              )}
              <p className="font-[family-name:var(--font-jakarta)] font-extrabold text-white text-sm">{plan.name}</p>
              <p className={`text-3xl font-extrabold mt-1 font-[family-name:var(--font-jakarta)] ${plan.highlight ? 'text-gradient-animated' : 'text-white'}`}>
                {plan.price}
              </p>
            </div>
          ))}
        </div>

        {rows.map((row, ri) => (
          <div key={ri} style={grid} className={ri % 2 === 0 ? 'bg-white/[0.015]' : ''}>
            <div className="px-5 py-3.5 flex items-center border-b border-white/5">
              <span className="text-sm text-[#CBD5E1]">{row.label}</span>
            </div>
            {row.values.map((val, ci) => (
              <div key={ci} className={`px-4 py-3.5 flex items-center justify-center border-b border-l border-white/5 ${plans[ci].highlight ? 'bg-[rgba(139,92,246,0.04)]' : ''}`}>
                {typeof val === 'boolean' ? (
                  val ? (
                    <BsCheck2Circle size={16} className={plans[ci].highlight ? 'text-[#8B5CF6]' : 'text-[#06B6D4]'} />
                  ) : (
                    <span className="text-[#64748B] font-bold select-none">-</span>
                  )
                ) : (
                  <span className={`text-sm font-semibold ${plans[ci].highlight ? 'text-[#c4b5fd]' : 'text-[#CBD5E1]'}`}>{val}</span>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={grid}>
          <div className="p-5" />
          {plans.map((plan) => (
            <div key={plan.name} className={`p-4 flex items-center justify-center border-l border-white/5 ${plan.highlight ? 'bg-[rgba(139,92,246,0.07)]' : ''}`}>
              <Link href="/register" className={`text-sm font-bold py-2.5 px-5 rounded-xl transition-all ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                {t('pricing.getStarted')}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FaqSection() {
  const { t } = useLocale();
  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ];
  return (
    <div className="space-y-3">
      {faqs.map(({ q, a }) => (
        <div key={q} className="luxury-card p-5 space-y-2">
          <div className="flex items-start gap-3">
            <BsQuestionCircle size={16} className="text-[#8B5CF6] shrink-0 mt-0.5" />
            <p className="font-semibold text-[#F1F5F9] text-sm">{q}</p>
          </div>
          <p className="text-[#CBD5E1] text-sm leading-relaxed pl-6">{a}</p>
        </div>
      ))}
    </div>
  );
}

export function CtaSection({ cta }: { cta: string }) {
  const { t } = useLocale();
  return (
    <div className="relative max-w-2xl mx-auto space-y-7 text-center">
      <div className="flex justify-center">
        <div className="badge-glow inline-flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest text-[#c4b5fd] uppercase">
          <BsRocketTakeoffFill size={11} /> {t('cta.ready')}
        </div>
      </div>
      <h2 className="font-[family-name:var(--font-jakarta)] text-5xl md:text-6xl font-extrabold">
        <span className="text-white">{t('cta.grow')}</span>
        <br />
        <span className="text-gradient-animated">{t('cta.today')}</span>
      </h2>
      <p className="text-[#CBD5E1] text-lg">{t('cta.subtitle')}</p>
      <div className="flex flex-wrap gap-4 justify-center pt-2">
        <Link href="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2.5">
          {cta} <BsArrowRight size={16} />
        </Link>
        <Link href="/login" className="btn-secondary text-base px-8 py-4">{t('nav.login')}</Link>
      </div>
    </div>
  );
}
