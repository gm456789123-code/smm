'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLocale } from './LocaleProvider';
import {
  BsShieldCheck, BsArrowRight, BsCheck2Circle,
  BsRocketTakeoffFill, BsStarFill, BsHeadset,
  BsBarChartLineFill, BsCreditCard2BackFill,
  BsInstagram, BsTiktok, BsYoutube, BsFacebook,
  BsLightningChargeFill, BsGlobe2,
} from 'react-icons/bs';

/* ── Stat counter ─────────────────────────────────────────────── */
export function HeroStatCounter({ rawValue, label, color }: { rawValue: string; label: string; color: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hasK   = /k/i.test(rawValue.replace(/[+,]/g, ''));
    const target = parseFloat(rawValue.replace(/[+,k\s]/gi, '')) * (hasK ? 1000 : 1);
    let started  = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const frames = 90; let frame = 0;
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

  const hasK    = /k/i.test(rawValue.replace(/[+,]/g, ''));
  const display = hasK ? `${Math.round(count / 1000)}K` : count.toLocaleString();

  return (
    <div ref={ref}>
      <p className="font-bold text-xl tabular-nums" style={{ color }}>
        {display}{rawValue.includes('+') ? '+' : ''}
      </p>
      <p className="pg-label mt-0.5">{label}</p>
    </div>
  );
}

/* ── Live orders card ─────────────────────────────────────────── */
const LIVE_ORDERS = [
  { Icon: BsInstagram, platform: 'Instagram', service: 'Followers - TH', pct: 78,  color: '#E1306C',  bar: 'linear-gradient(90deg,#C9B1E8,#F5C6D0)', done: false },
  { Icon: BsTiktok,    platform: 'TikTok',    service: 'Video Views',     pct: 100, color: '#2D1B4E',  bar: 'linear-gradient(90deg,#B8E0D2,#6DB89A)',  done: true  },
  { Icon: BsYoutube,   platform: 'YouTube',   service: 'Watch Hours',     pct: 41,  color: '#FF0000',  bar: 'linear-gradient(90deg,#F8D5C2,#E8906A)',  done: false },
  { Icon: BsFacebook,  platform: 'Facebook',  service: 'Page Likes',      pct: 62,  color: '#1877F2',  bar: 'linear-gradient(90deg,#B5D4E8,#6BAED6)',  done: false },
];

export function HeroDashboardCard() {
  return (
    <div className="relative">
      {/* Subtle glow behind card */}
      <div className="absolute -inset-6 rounded-3xl blur-3xl pointer-events-none" style={{ background: 'rgba(201,177,232,0.25)' }} />
      <div className="pg-glass-strong relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/30">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6DB89A] animate-pulse" />
            <span className="text-xs font-semibold text-[#2D1B4E]">Live Orders</span>
          </div>
          <span className="text-[10px] text-[#8B7A9E] font-mono">Updated 2s ago</span>
        </div>

        {/* Order rows */}
        {LIVE_ORDERS.map(({ Icon, platform, service, pct, color, bar, done }) => (
          <div key={platform} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-white/20 last:border-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/40 border border-white/50">
              <Icon size={15} color={color} aria-hidden="true" focusable="false" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-[#2D1B4E] truncate">{service}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                  done
                    ? 'bg-[rgba(109,184,154,0.25)] text-[#3A8C6E] border border-[rgba(109,184,154,0.40)]'
                    : 'bg-[rgba(201,177,232,0.30)] text-[#6D3BAF] border border-[rgba(201,177,232,0.50)]'
                }`}>
                  {done ? 'Done' : 'Running'}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: bar }} />
              </div>
              <p className="text-[9px] text-[#8B7A9E] mt-1 font-mono">{platform} · {pct}%</p>
            </div>
          </div>
        ))}

        {/* Footer stats */}
        <div className="grid grid-cols-2 divide-x divide-white/25 border-t border-white/25">
          <div className="px-5 py-3.5 text-center">
            <p className="font-bold text-lg text-[#2D1B4E]">127</p>
            <p className="text-[9px] text-[#8B7A9E] uppercase tracking-wider mt-0.5">orders today</p>
          </div>
          <div className="px-5 py-3.5 text-center">
            <p className="font-bold text-lg text-[#3A8C6E]">THB 0.001</p>
            <p className="text-[9px] text-[#8B7A9E] uppercase tracking-wider mt-0.5">per follower</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Features ─────────────────────────────────────────────────── */
const FEATURE_CARDS = [
  { icon: BsLightningChargeFill, key: 'features.fast',    cls: 'pg-card-peach',   iconColor: '#C87941' },
  { icon: BsShieldCheck,         key: 'features.safe',    cls: 'pg-card-mint',    iconColor: '#3A8C6E' },
  { icon: BsBarChartLineFill,    key: 'features.quality', cls: 'pg-card-purple',  iconColor: '#7C3AED' },
  { icon: BsHeadset,             key: 'features.support', cls: 'pg-card-blue',    iconColor: '#2563EB' },
  { icon: BsCreditCard2BackFill, key: 'features.payment', cls: 'pg-card-pink',    iconColor: '#BE185D' },
  { icon: BsGlobe2,              key: 'features.global',  cls: 'pg-card-peach',   iconColor: '#6D3BAF' },
];

export function FeaturesSection() {
  const { t } = useLocale();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURE_CARDS.map(({ icon: Icon, key, cls, iconColor }) => (
        <div key={key} className={`${cls} p-6 flex items-start gap-4 transition-transform hover:-translate-y-1`}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-white/40 border border-white/50">
            <Icon size={20} color={iconColor} aria-hidden="true" focusable="false" />
          </div>
          <div>
            <p className="font-semibold text-[#2D1B4E] text-sm">{t(`${key}.label`)}</p>
            <p className="text-[#4A3B63] text-xs mt-1 leading-relaxed">{t(`${key}.desc`)}</p>
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
      <p className="pg-label">Why Choose Us</p>
      <h2 className="font-extrabold text-4xl text-[#2D1B4E] leading-tight">
        {t('features.title')}{' '}
        <span className="pg-text-gradient">{brand}</span>
      </h2>
    </div>
  );
}

export function PlatformsTitle() {
  const { t } = useLocale();
  return (
    <div className="text-center space-y-3">
      <p className="pg-label">Platforms</p>
      <h2 className="font-extrabold text-4xl text-[#2D1B4E] leading-tight">{t('platforms.title')}</h2>
      <p className="text-[#4A3B63] text-sm">{t('platforms.subtitle')}</p>
    </div>
  );
}

/* ── Pricing ──────────────────────────────────────────────────── */
export function PricingTitle() {
  const { t } = useLocale();
  const title = t('pricing.title');
  const parts = title.split('&');
  return (
    <div className="text-center space-y-3">
      <p className="pg-label">Pricing</p>
      <h2 className="font-extrabold text-4xl text-[#2D1B4E] leading-tight">
        {parts.length > 1 ? (
          <>{parts[0].trim()} <span className="pg-text-gradient">&amp; {parts.slice(1).join('&').trim()}</span></>
        ) : (
          <span className="pg-text-gradient">{title}</span>
        )}
      </h2>
      <p className="text-[#4A3B63] text-sm">{t('pricing.subtitle')}</p>
    </div>
  );
}

export function PricingPlans() {
  const { t } = useLocale();

  const plans = [
    { name: 'Starter', price: 'THB 100',   highlight: false },
    { name: 'Popular', price: 'THB 500',   highlight: true  },
    { name: 'Pro',     price: 'THB 2,000', highlight: false },
  ];

  type CellVal = boolean | string;
  const rows: { label: string; values: CellVal[] }[] = [
    { label: 'Minimum top-up',                       values: ['THB 100', 'THB 500', 'THB 2,000'] },
    { label: 'Price / 1,000',                        values: ['~THB 3',  '~THB 2.5', '~THB 2']  },
    { label: t('pricing.features.allBasic'),         values: [true, true, true]  },
    { label: t('pricing.features.autoSystem'),       values: [true, true, true]  },
    { label: 'Support',                              values: ['Chat', 'Priority', 'Dedicated'] },
    { label: t('pricing.features.bulkPrice'),        values: [false, true, true]  },
    { label: t('pricing.features.refillGuarantee'),  values: [false, true, true]  },
    { label: t('pricing.features.apiAccess'),        values: [false, false, true] },
    { label: t('pricing.features.customServices'),   values: [false, false, true] },
  ];

  const grid = { display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr' };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px] pg-pricing">
        {/* Plan headers */}
        <div style={grid}>
          <div className="p-5 border-b border-white/25" />
          {plans.map((plan) => (
            <div key={plan.name} className={`p-5 text-center border-b border-l border-white/25 ${plan.highlight ? 'pg-pricing-col-highlight' : ''}`}>
              {plan.highlight && (
                <div className="flex justify-center mb-2">
                  <span className="pg-pricing-popular-badge px-2.5 py-1">
                    <BsStarFill size={8} /> {t('pricing.popular')}
                  </span>
                </div>
              )}
              <p className="font-semibold text-[#2D1B4E] text-sm">{plan.name}</p>
              <p className={`text-3xl font-bold mt-1 ${plan.highlight ? 'pg-text-gradient' : 'text-[#2D1B4E]'}`}>
                {plan.price}
              </p>
            </div>
          ))}
        </div>

        {rows.map((row, ri) => (
          <div key={ri} style={grid} className={ri % 2 === 0 ? 'bg-white/10' : ''}>
            <div className="px-5 py-3.5 flex items-center border-b border-white/15">
              <span className="text-sm text-[#4A3B63]">{row.label}</span>
            </div>
            {row.values.map((val, ci) => (
              <div key={ci} className={`px-4 py-3.5 flex items-center justify-center border-b border-l border-white/15 ${plans[ci].highlight ? 'pg-pricing-col-highlight' : ''}`}>
                {typeof val === 'boolean' ? (
                  val
                    ? <BsCheck2Circle size={16} className={plans[ci].highlight ? 'text-[#9B6DD5]' : 'text-[#6DB89A]'} />
                    : <span className="text-[#8B7A9E] font-bold select-none">—</span>
                ) : (
                  <span className={`text-sm font-medium ${plans[ci].highlight ? 'text-[#6D3BAF]' : 'text-[#2D1B4E]'}`}>{val}</span>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={grid}>
          <div className="p-5" />
          {plans.map((plan) => (
            <div key={plan.name} className={`p-4 flex items-center justify-center border-l border-white/25 ${plan.highlight ? 'pg-pricing-col-highlight' : ''}`}>
              <Link
                href="/register"
                className={plan.highlight ? 'pg-btn-primary px-5 py-2.5 text-sm' : 'pg-btn-outline px-5 py-2.5 text-sm'}
              >
                {t('pricing.getStarted')}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────── */
export function FaqSection() {
  const { t } = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
  ];

  return (
    <div className="pg-faq-wrap">
      {faqs.map(({ q, a }, i) => (
        <div key={i} className="pg-faq-item">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left gap-4 hover:bg-white/15 transition-colors"
          >
            <span className="font-medium text-[#2D1B4E] text-sm">{q}</span>
            <span className="text-[#8B7A9E] text-lg font-light shrink-0 w-5 text-center">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-[#4A3B63] text-sm leading-relaxed">{a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── CTA ──────────────────────────────────────────────────────── */
export function CtaSection({ cta }: { cta: string }) {
  const { t } = useLocale();
  return (
    <div className="relative max-w-2xl mx-auto space-y-7 text-center z-10">
      <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase text-[#6D3BAF]"
        style={{ background: 'rgba(201,177,232,0.35)', border: '1px solid rgba(201,177,232,0.55)' }}>
        <BsRocketTakeoffFill size={10} /> {t('cta.ready')}
      </span>
      <h2 className="font-extrabold text-5xl md:text-6xl text-[#2D1B4E] leading-[1.08]">
        {t('cta.grow')}{' '}
        <span className="pg-text-gradient">{t('cta.today')}</span>
      </h2>
      <p className="text-[#4A3B63] text-lg">{t('cta.subtitle')}</p>
      <div className="flex flex-wrap gap-4 justify-center pt-2">
        <Link href="/register" className="pg-btn-primary px-10 py-4 text-base">
          {cta} <BsArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/login" className="pg-btn-outline px-8 py-4 text-base">
          {t('nav.login')}
        </Link>
      </div>
    </div>
  );
}
