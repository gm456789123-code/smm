'use client';

import Link from 'next/link';
import { useLocale } from './LocaleProvider';
import {
  BsBoxSeam, BsPeopleFill, BsGlobe2, BsLightningChargeFill,
  BsShieldCheck, BsArrowRight, BsCheck2Circle,
  BsRocketTakeoffFill, BsStarFill, BsHeadset,
  BsBarChartLineFill, BsCreditCard2BackFill, BsQuestionCircle,
} from 'react-icons/bs';

export function HeroBadge() {
  const { t } = useLocale();
  return (
    <div className="inline-flex items-center gap-2.5 badge-glow px-5 py-2 text-xs font-bold tracking-widest text-[#c4b5fd] uppercase">
      <BsRocketTakeoffFill size={11} className="text-[#8B5CF6]" />
      {t('hero.badge')}
      <BsStarFill size={9} className="text-[#F59E0B]" />
    </div>
  );
}

export function HeroText({ brand }: { brand: string }) {
  const { t } = useLocale();
  void brand;
  return (
    <>
      <p className="text-xl md:text-2xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed font-light">
        {t('hero.tagline')}
      </p>
      <p className="text-[#475569] text-base">{t('hero.desc')}</p>
      <div className="flex flex-wrap gap-4 justify-center pt-1">
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
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
      {[
        { icon: BsBoxSeam,            value: '50K+',  key: 'hero.stats.orders',    color: 'text-[#8B5CF6]' },
        { icon: BsPeopleFill,          value: '10K+',  key: 'hero.stats.users',     color: 'text-[#06B6D4]' },
        { icon: BsGlobe2,              value: '10+',   key: 'hero.stats.platforms', color: 'text-violet-400' },
        { icon: BsLightningChargeFill, value: '99.9%', key: 'hero.stats.uptime',    color: 'text-emerald-400' },
      ].map(({ icon: Icon, value, key, color }) => (
        <div key={key} className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Icon size={13} className={color} />
            <span className={`font-[family-name:var(--font-jakarta)] text-2xl font-extrabold ${color}`}>{value}</span>
          </div>
          <p className="text-[10px] text-[#475569] uppercase tracking-wider mt-0.5">{t(key)}</p>
        </div>
      ))}
    </div>
  );
}

export function FeaturesSection() {
  const { t } = useLocale();
  const FEATURES = [
    { icon: BsLightningChargeFill, key: 'features.fast',    color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)' },
    { icon: BsShieldCheck,          key: 'features.safe',    color: '#10B981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)' },
    { icon: BsBarChartLineFill,    key: 'features.quality', color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.25)' },
    { icon: BsHeadset,             key: 'features.support', color: '#06B6D4', bg: 'rgba(6,182,212,0.10)',   border: 'rgba(6,182,212,0.25)'  },
    { icon: BsCreditCard2BackFill, key: 'features.payment', color: '#EC4899', bg: 'rgba(236,72,153,0.10)',  border: 'rgba(236,72,153,0.25)' },
    { icon: BsGlobe2,              key: 'features.global',  color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.25)' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURES.map(({ icon: Icon, key, color, bg, border }) => (
        <div key={key} className="luxury-card p-6 flex items-start gap-4">
          <div className="icon-box shrink-0" style={{ background: bg, borderColor: border }}>
            <Icon size={20} color={color} />
          </div>
          <div>
            <p className="font-[family-name:var(--font-jakarta)] font-bold text-[#F1F5F9] text-sm">{t(`${key}.label`)}</p>
            <p className="text-[#475569] text-xs mt-1 leading-relaxed">{t(`${key}.desc`)}</p>
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
        {t('features.title')}<span className="text-gradient-animated"> {brand}</span>
      </h2>
    </div>
  );
}

export function PlatformsTitle() {
  const { t } = useLocale();
  return (
    <div className="text-center space-y-3">
      <p className="section-label text-[#06B6D4]">Platforms</p>
      <h2 className="font-[family-name:var(--font-jakarta)] text-4xl font-extrabold">
        <span className="text-white">{t('platforms.title').split('ของเรา')[0] || t('platforms.title')}</span>
        <span className="text-gradient-animated"> {t('platforms.title').includes('ของเรา') ? 'ของเรา' : ''}</span>
      </h2>
      <p className="text-[#475569]">{t('platforms.subtitle')}</p>
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
            {parts[0].trim()}<span className="text-shimmer">&nbsp;&amp; {parts.slice(1).join('&').trim()}</span>
          </>
        ) : (
          <span className="text-shimmer">{title}</span>
        )}
      </h2>
    </div>
  );
}

export function PricingPlans() {
  const { t } = useLocale();
  const plans = [
    {
      name: 'Starter', price: '฿100', perK: `~฿3 ${t('pricing.perK')}`, highlight: false,
      features: ['allBasic','autoSystem','chatSupport'],
    },
    {
      name: 'Popular', price: '฿500', perK: `~฿2.5 ${t('pricing.perK')}`, highlight: true,
      features: ['allStarter','bulkPrice','prioritySupport','refillGuarantee'],
    },
    {
      name: 'Pro', price: '฿2,000', perK: `~฿2 ${t('pricing.perK')}`, highlight: false,
      features: ['allPopular','apiAccess','accountManager','customServices'],
    },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {plans.map(plan => (
        <div key={plan.name}
          className={`luxury-card p-7 space-y-5 ${plan.highlight ? 'ring-1 ring-[rgba(139,92,246,0.50)] shadow-[0_0_50px_rgba(139,92,246,0.15)]' : ''}`}>
          {plan.highlight && (
            <div className="flex justify-center -mt-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[rgba(139,92,246,0.20)] border border-[rgba(139,92,246,0.45)] text-[#c4b5fd]">
                <BsStarFill size={9} className="text-[#F59E0B]" /> {t('pricing.popular')}
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
                {t(`pricing.features.${f}`)}
              </li>
            ))}
          </ul>
          <Link href="/register"
            className={`block text-center py-3 rounded-xl text-sm font-bold transition-all ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
            {t('pricing.getStarted')}
          </Link>
        </div>
      ))}
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
          <p className="text-[#94A3B8] text-sm leading-relaxed pl-6">{a}</p>
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
        <span className="text-white">{t('cta.grow')}</span><br />
        <span className="text-gradient-animated">{t('cta.today')}</span>
      </h2>
      <p className="text-[#94A3B8] text-lg">{t('cta.subtitle')}</p>
      <div className="flex flex-wrap gap-4 justify-center pt-2">
        <Link href="/register" className="btn-primary text-base px-10 py-4 inline-flex items-center gap-2.5">
          {cta} <BsArrowRight size={16} />
        </Link>
        <Link href="/login" className="btn-secondary text-base px-8 py-4">{t('nav.login')}</Link>
      </div>
    </div>
  );
}
