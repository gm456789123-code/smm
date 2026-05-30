'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewBlogPage() {
  const router = useRouter();
  const [form, setForm]   = useState({ title: '', slug: '', excerpt: '', content: '', cover_image: '' });
  const [saving, setSave] = useState(false);
  const [error, setError] = useState('');

  function toSlug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9ก-๙\s-]/g, '').replace(/\s+/g, '-').substring(0, 100);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(p => ({
      ...p,
      [name]: value,
      ...(name === 'title' ? { slug: toSlug(value) } : {}),
    }));
  }

  async function handleSave(published: boolean) {
    setSave(true); setError('');
    const res = await fetch('/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, published: published ? 1 : 0 }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error); setSave(false); return; }
    router.push('/admin/blog');
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">บทความใหม่</h1>
      </div>

      <div className="glass p-6 space-y-4">
        {[
          { name: 'title',        label: 'หัวข้อบทความ *',        placeholder: 'หัวข้อ...' },
          { name: 'slug',         label: 'Slug (URL) *',           placeholder: 'url-slug' },
          { name: 'cover_image',  label: 'Cover Image URL',        placeholder: 'https://...' },
          { name: 'excerpt',      label: 'บทสรุปย่อ',             placeholder: 'บทสรุปสั้นๆ...' },
        ].map(f => (
          <div key={f.name} className="space-y-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">{f.label}</label>
            <input name={f.name} value={form[f.name as keyof typeof form]} onChange={handleChange}
              placeholder={f.placeholder}
              className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
          </div>
        ))}

        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">เนื้อหา (HTML)</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={12}
            placeholder="<p>เนื้อหาบทความ...</p>"
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors resize-y" />
        </div>

        {error && <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] px-3 py-2 rounded-xl">{error}</p>}

        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving}
            className="glass-tab flex-1 py-2.5 text-sm text-[#94A3B8] hover:text-white disabled:opacity-50">
            บันทึกเป็นร่าง
          </button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="glass-tab glass-tab-active flex-1 py-2.5 text-sm font-semibold text-[#c4b5fd] hover:text-white disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : 'เผยแพร่'}
          </button>
        </div>
      </div>
    </main>
  );
}
