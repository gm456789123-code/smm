'use client';

import { useEffect, useState } from 'react';
import MediaLibraryModal from '@/components/MediaLibraryModal';

interface Setting { key: string; label: string; value: string }

const SETTING_LABELS: Record<string, string> = {
  logo_url:      'โลโก้ (URL หรือเลือกจากคลังภาพ)',
  favicon_url:   'Favicon — ไอคอนบน Tab (เลือกจากคลังภาพ แนะนำ .png สี่เหลี่ยมจัตุรัส)',
  brand_name:    'ชื่อแบรนด์',
  brand_tagline: 'Tagline',
  brand_desc:    'คำอธิบายแบรนด์',
  hero_cta:      'ปุ่ม CTA (Hero)',
  stat_orders:   'จำนวนออเดอร์ (แสดงหน้าแรก)',
  stat_users:    'จำนวนลูกค้า (แสดงหน้าแรก)',
  stat_platforms:'จำนวนแพลตฟอร์ม',
  stat_uptime:   'Uptime',
  announcement_active: 'แสดง Announcement Banner (1 = เปิด, 0 = ปิด)',
  announcement_text:   'ข้อความ Announcement',
  referral_commission_pct: 'Commission Referral (%)',
};

const TEXTAREA_KEYS = new Set(['announcement_text', 'brand_desc']);

const SOCIAL_PLATFORMS = [
  { key: 'line',     label: 'LINE',     color: '#06C755', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  )},
  { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )},
  { key: 'telegram', label: 'Telegram', color: '#2AABEE', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )},
  { key: 'discord',  label: 'Discord',  color: '#5865F2', icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
    </svg>
  )},
] as const;

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [mediaPick, setMediaPick] = useState<'logo_url' | 'favicon_url' | null>(null);

  const DEFAULTS: Record<string, string> = {
    announcement_active:     '0',
    announcement_text:       '',
    referral_commission_pct: '5',
    line_active:     '0', facebook_active: '0',
    telegram_active: '0', discord_active:  '0',
  };

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        const merged = { ...DEFAULTS, ...data };
        // main settings
        const main = Object.entries(SETTING_LABELS).map(([key, label]) => ({ key, label, value: merged[key] ?? '' }));
        // social keys (not in SETTING_LABELS but need to be in state for save)
        const socialKeys = SOCIAL_PLATFORMS.flatMap(p => [`${p.key}_url`, `${p.key}_active`]);
        const social = socialKeys.map(key => ({ key, label: key, value: merged[key] ?? '' }));
        setSettings([...main, ...social]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function get(key: string) { return settings.find(s => s.key === key)?.value ?? ''; }
  function set(key: string, value: string) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  }

  async function saveAll(overrides?: Record<string, string>) {
    setSaving(true);
    const body = Object.fromEntries(settings.map(s => [s.key, s.value]));
    if (overrides) Object.assign(body, overrides);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function pickFromLibrary(key: 'logo_url' | 'favicon_url', url: string) {
    const updated = settings.map(s => s.key === key ? { ...s, value: url } : s);
    setSettings(updated);
    setMediaPick(null);
    // auto-save like previous upload flow
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(updated.map(s => [s.key, s.value]))),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const mainSettings = settings.filter(s => SETTING_LABELS[s.key]);

  return (
    <>
    {mediaPick && (
      <MediaLibraryModal
        mode="pick"
        title={mediaPick === 'logo_url' ? 'เลือกโลโก้จากคลังภาพ' : 'เลือก Favicon จากคลังภาพ'}
        onSelect={(item) => pickFromLibrary(mediaPick, item.url)}
        onClose={() => setMediaPick(null)}
      />
    )}
    <main className="flex-1 p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">ตั้งค่าเว็บ (CMS)</h1>
        <p className="text-[#94A3B8] text-sm mt-0.5">แก้ไขเนื้อหาหน้าแรกได้เลย</p>
      </div>

      {/* Main settings */}
      <div className="glass p-6 space-y-4">
        {mainSettings.map(({ key, label, value }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs text-[#94A3B8] uppercase tracking-wider">{label}</label>
            {TEXTAREA_KEYS.has(key) ? (
              <textarea value={value} rows={3} onChange={e => set(key, e.target.value)}
                className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors resize-none" />
            ) : key === 'logo_url' || key === 'favicon_url' ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={key === 'logo_url' ? '/logo.png (ฝังในโค้ด)' : value}
                    readOnly={key === 'logo_url'}
                    onChange={key === 'logo_url' ? undefined : e => set(key, e.target.value)}
                    placeholder="https://... หรือเลือกจากคลังภาพ →"
                    className={`glass flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder-[#475569] transition-colors ${key === 'logo_url' ? 'text-[#64748B] cursor-not-allowed select-none' : 'text-[#F1F5F9] focus:border-[rgba(139,92,246,0.45)]'}`} />
                  <button
                    type="button"
                    disabled={key === 'logo_url'}
                    onClick={key === 'logo_url' ? undefined : () => setMediaPick(key as 'favicon_url')}
                    className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all whitespace-nowrap ${key === 'logo_url' ? 'border-[rgba(139,92,246,0.15)] text-[#475569] cursor-not-allowed opacity-40' : 'border-[rgba(139,92,246,0.35)] text-[#a78bfa] hover:bg-[rgba(139,92,246,0.15)]'}`}
                  >
                    {key === 'logo_url' ? '🔒 ล็อก' : '🖼 คลังภาพ'}
                  </button>
                </div>
                {key === 'logo_url' ? (
                  <div className="flex items-center gap-3 p-2.5 glass rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="logo" className="h-8 w-8 object-contain rounded" />
                    <span className="text-xs text-[#64748B] flex-1">โลโก้ฝังในโค้ด — แก้ไขผ่าน public/logo.png</span>
                  </div>
                ) : value ? (
                  <div className="flex items-center gap-3 p-2.5 glass rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value} alt="preview" className="h-8 w-8 object-contain rounded"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <span className="text-xs text-[#94A3B8] truncate flex-1">{value}</span>
                    <button
                      type="button"
                      onClick={() => set(key, '')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 shrink-0"
                    >
                      ลบ
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <input value={value} onChange={e => set(key, e.target.value)}
                className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
            )}
          </div>
        ))}

        <button onClick={() => saveAll()} disabled={saving}
          className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors disabled:opacity-50 mt-2">
          {saved ? '✅ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>

      {/* Social float buttons */}
      <div className="glass p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">ช่องทางติดต่อ (ลอยมุมขวาล่าง)</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">เปิด/ปิดและตั้งค่า URL แต่ละช่องทาง</p>
        </div>

        {SOCIAL_PLATFORMS.map(({ key, label, color, icon }) => {
          const activeKey = `${key}_active`;
          const urlKey    = `${key}_url`;
          const isActive  = get(activeKey) === '1';
          const url       = get(urlKey);
          return (
            <div key={key} className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5" style={{ color }}>
                  {icon}
                  <span className="text-sm font-medium text-white">{label}</span>
                </div>
                {/* Toggle */}
                <button type="button"
                  onClick={() => set(activeKey, isActive ? '0' : '1')}
                  className={['relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none',
                    isActive ? 'bg-[rgba(139,92,246,0.7)]' : 'bg-[rgba(255,255,255,0.1)]'].join(' ')}>
                  <span className={['pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5',
                    isActive ? 'translate-x-5' : 'translate-x-0.5'].join(' ')} />
                </button>
              </div>
              {isActive && (
                <input value={url} onChange={e => set(urlKey, e.target.value)}
                  placeholder={`https://${key === 'line' ? 'line.me/ti/p/...' : key === 'facebook' ? 'fb.me/...' : key === 'telegram' ? 't.me/...' : 'discord.gg/...'}`}
                  className="glass w-full px-3 py-2 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
              )}
            </div>
          );
        })}

        <button onClick={() => saveAll()} disabled={saving}
          className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors disabled:opacity-50 mt-2">
          {saved ? '✅ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </main>
    </>
  );
}
