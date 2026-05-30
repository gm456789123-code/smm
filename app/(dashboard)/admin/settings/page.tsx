'use client';

import { useEffect, useState } from 'react';

interface Setting { key: string; label: string; value: string }

const SETTING_LABELS: Record<string, string> = {
  brand_name:    'ชื่อแบรนด์',
  brand_tagline: 'Tagline',
  brand_desc:    'คำอธิบายแบรนด์',
  hero_cta:      'ปุ่ม CTA (Hero)',
  stat_orders:   'จำนวนออเดอร์ (แสดงหน้าแรก)',
  stat_users:    'จำนวนลูกค้า (แสดงหน้าแรก)',
  stat_platforms:'จำนวนแพลตฟอร์ม',
  stat_uptime:   'Uptime',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        const list = Object.entries(data as Record<string,string>).map(([key, value]) => ({
          key, label: SETTING_LABELS[key] ?? key, value,
        }));
        setSettings(list);
      });
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
        <p className="text-[#475569] text-sm mt-0.5">แก้ไขเนื้อหาหน้าแรกได้เลย</p>
      </div>

      <div className="glass p-6 space-y-4">
        {settings.map(({ key, label, value }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">{label}</label>
            <input
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
            />
          </div>
        ))}

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
