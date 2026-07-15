'use client';

import { useEffect, useState } from 'react';

interface Setting { key: string; label: string; value: string }

const SETTING_LABELS: Record<string, string> = {
  logo_url:      'URL โลโก้ (ใส่ลิงก์รูป หรือ /logo.png ถ้าวางในโฟลเดอร์ public)',
  brand_name:    'ชื่อแบรนด์',
  brand_tagline: 'Tagline',
  brand_desc:    'คำอธิบายแบรนด์',
  hero_cta:      'ปุ่ม CTA (Hero)',
  stat_orders:   'จำนวนออเดอร์ (แสดงหน้าแรก)',
  stat_users:    'จำนวนลูกค้า (แสดงหน้าแรก)',
  stat_platforms:'จำนวนแพลตฟอร์ม',
  stat_uptime:   'Uptime',
  line_url:      'LINE URL (ปุ่มลอยมุมขวาล่าง)',
  announcement_active: 'แสดง Announcement Banner (1 = เปิด, 0 = ปิด)',
  announcement_text:   'ข้อความ Announcement',
  referral_commission_pct: 'Commission Referral (%)',
};

// Settings that use textarea instead of input
const TEXTAREA_KEYS = new Set(['announcement_text', 'brand_desc']);

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Default values for settings that may not exist in DB yet
  const DEFAULTS: Record<string, string> = {
    announcement_active:     '0',
    announcement_text:       '',
    referral_commission_pct: '5',
  };

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        // Merge DB data with defaults so new keys always appear
        const merged = { ...DEFAULTS, ...data };
        const list = Object.entries(SETTING_LABELS).map(([key, label]) => ({
          key, label, value: merged[key] ?? '',
        }));
        setSettings(list);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(key: string, value: string) {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value } : s));
  }

  async function handleSave() {
    setSaving(true);
    const body = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">ตั้งค่าเว็บ (CMS)</h1>
        <p className="text-[#94A3B8] text-sm mt-0.5">แก้ไขเนื้อหาหน้าแรกได้เลย</p>
      </div>

      <div className="glass p-6 space-y-4">
        {settings.map(({ key, label, value }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs text-[#94A3B8] uppercase tracking-wider">{label}</label>
            {TEXTAREA_KEYS.has(key) ? (
              <textarea
                value={value}
                rows={3}
                onChange={(e) => handleChange(key, e.target.value)}
                className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors resize-none"
              />
            ) : (
              <input
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
              />
            )}
          </div>
        ))}

        {/* Logo preview */}
        {settings.find(s => s.key === 'logo_url')?.value && (
          <div className="space-y-1.5">
            <p className="text-xs text-[#94A3B8] uppercase tracking-wider">ตัวอย่างโลโก้</p>
            <div className="glass p-4 rounded-xl flex items-center gap-4">
              {/* Dark bg preview */}
              <div className="flex-1 flex items-center justify-center bg-[#0D1220] rounded-xl p-3 h-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.find(s => s.key === 'logo_url')?.value}
                  alt="logo preview"
                  className="max-h-10 max-w-full object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <p className="text-xs text-[#94A3B8] shrink-0">ตัวอย่างใน Sidebar<br/>(พื้นหลังเข้ม)</p>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors disabled:opacity-50 mt-2"
        >
          {saved ? '✅ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
    </main>
  );
}
