'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  BsCheck2Circle, BsXCircle, BsDashCircle,
  BsEye, BsPencilSquare, BsGraphUp, BsUpload, BsX,
} from 'react-icons/bs';

const RichEditor = dynamic(() => import('./RichEditor'), { ssr: false });

// ---- types ----
export interface BlogForm {
  title: string; slug: string; excerpt: string; content: string;
  cover_image: string; meta_title: string; meta_description: string;
  focus_keyword: string; og_image: string;
}

const EMPTY: BlogForm = {
  title: '', slug: '', excerpt: '', content: '',
  cover_image: '', meta_title: '', meta_description: '',
  focus_keyword: '', og_image: '',
};

// ---- SEO scoring ----
function countWords(html: string) {
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

interface SeoCheck { label: string; pass: boolean | null }

function useSeoChecks(form: BlogForm): { checks: SeoCheck[]; score: number; color: string } {
  return useMemo(() => {
    const kw  = form.focus_keyword.toLowerCase().trim();
    const txt = form.content.replace(/<[^>]+>/g, ' ').toLowerCase();
    const seoTitle = (form.meta_title || form.title).toLowerCase();

    const checks: SeoCheck[] = kw ? [
      { label: 'Focus keyword อยู่ใน SEO title',       pass: seoTitle.includes(kw) },
      { label: 'Focus keyword อยู่ใน meta description', pass: form.meta_description.toLowerCase().includes(kw) },
      { label: 'Focus keyword อยู่ใน slug',             pass: form.slug.toLowerCase().includes(kw.replace(/\s+/g, '-')) },
      { label: 'Focus keyword อยู่ในเนื้อหา (≥3 ครั้ง)',pass: (txt.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length >= 3 },
      { label: 'Focus keyword อยู่ใน paragraph แรก',   pass: txt.split(/[.!?]/)[0]?.includes(kw) ?? false },
    ] : [
      { label: 'กรอก Focus keyword ก่อน', pass: null },
    ];

    const readability: SeoCheck[] = [
      { label: `SEO title ยาว ${(form.meta_title || form.title).length} ตัว (แนะนำ 10–60)`,
        pass: (form.meta_title || form.title).length >= 10 && (form.meta_title || form.title).length <= 60 },
      { label: `Meta description ยาว ${form.meta_description.length} ตัว (แนะนำ 50–155)`,
        pass: form.meta_description.length >= 50 && form.meta_description.length <= 155 },
      { label: `เนื้อหา ${countWords(form.content)} คำ (แนะนำ ≥300)`,
        pass: countWords(form.content) >= 300 },
      { label: 'มี cover image',
        pass: !!form.cover_image },
      { label: 'มี H2 หรือ H3 ในเนื้อหา',
        pass: /<h[23]/i.test(form.content) },
      { label: 'มี internal/external link',
        pass: /<a\s/i.test(form.content) },
    ];

    const all = [...checks, ...readability];
    const passed = all.filter(c => c.pass === true).length;
    const total  = all.filter(c => c.pass !== null).length;
    const score  = total > 0 ? Math.round((passed / total) * 100) : 0;
    const color  = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

    return { checks: all, score, color };
  }, [form]);
}

// ---- char counter color ----
function counterColor(len: number, min: number, max: number) {
  if (len === 0) return '#475569';
  if (len < min) return '#f59e0b';
  if (len > max) return '#ef4444';
  return '#22c55e';
}

// ---- main component ----
interface Props { initial?: BlogForm; postId?: number }

export default function BlogEditor({ initial, postId }: Props) {
  const router  = useRouter();
  const [form,  setForm]   = useState<BlogForm>(initial ?? EMPTY);
  const [tab,   setTab]    = useState<'write' | 'preview' | 'seo'>('write');
  const [saving, setSave]  = useState(false);
  const [error,  setError] = useState('');
  const [imgUploading, setImgUploading] = useState<Record<string, boolean>>({});
  const coverRef = useRef<HTMLInputElement>(null);
  const ogRef    = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File, key: 'cover_image' | 'og_image') {
    setImgUploading(p => ({ ...p, [key]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.url) set(key, d.url);
      else setError(d.error ?? 'อัปโหลดไม่สำเร็จ');
    } finally {
      setImgUploading(p => ({ ...p, [key]: false }));
    }
  }

  const { checks, score, color } = useSeoChecks(form);

  function toSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9ก-๙\s-]/g, '').replace(/\s+/g, '-').slice(0, 100);
  }

  const set = useCallback((k: keyof BlogForm, v: string) =>
    setForm(p => ({ ...p, [k]: v })), []);

  function handleTitle(v: string) {
    setForm(p => ({ ...p, title: v, slug: p.slug || toSlug(v) }));
  }

  async function save(published: boolean) {
    setSave(true); setError('');
    const url    = postId ? `/api/admin/blog/${postId}` : '/api/admin/blog';
    const method = postId ? 'PUT' : 'POST';
    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, published: published ? 1 : 0 }),
    });
    const text = await res.text();
    let d: { id?: number; ok?: boolean; error?: string } = {};
    try { d = JSON.parse(text); } catch { /* empty or non-JSON response */ }
    if (!res.ok) { setError(d.error ?? 'เกิดข้อผิดพลาด'); setSave(false); return; }
    router.push('/admin/blog');
  }

  const seoTitleLen = (form.meta_title || form.title).length;
  const metaDescLen = form.meta_description.length;

  return (
    <div className="flex gap-5 items-start">

      {/* ===== LEFT: editor ===== */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Title */}
        <div className="glass p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-white uppercase tracking-widest">หัวข้อบทความ *</label>
            <input value={form.title} onChange={e => handleTitle(e.target.value)}
              placeholder="หัวข้อที่ดึงดูดผู้อ่าน..."
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none placeholder-[#334155] transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-white uppercase tracking-widest">Slug (URL)</label>
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(139,92,246,0.15)] rounded-xl px-4 py-2.5">
              <span className="text-white text-sm shrink-0">/blog/</span>
              <input value={form.slug} onChange={e => set('slug', toSlug(e.target.value))}
                className="flex-1 bg-transparent text-sm text-[#a78bfa] outline-none font-mono" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {([
            ['write',   <BsPencilSquare size={14} />, 'เขียน'],
            ['preview', <BsEye size={14} />,          'Preview'],
            ['seo',     <BsGraphUp size={14} />,      'SEO'],
          ] as const).map(([k, icon, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={['glass-tab flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all',
                tab === k ? 'glass-tab-active text-[#c4b5fd]' : 'text-white'].join(' ')}>
              {icon}{l}
            </button>
          ))}
        </div>

        {/* Write tab */}
        {tab === 'write' && (
          <RichEditor
            value={form.content}
            onChange={v => set('content', v)}
            placeholder="เริ่มเขียนบทความที่นี่..."
          />
        )}

        {/* Preview tab */}
        {tab === 'preview' && (
          <div className="glass p-6">
            {form.cover_image && (
              <img src={form.cover_image} alt="" className="w-full rounded-xl mb-6 max-h-64 object-cover" />
            )}
            <h1 className="text-2xl font-bold text-white mb-2">{form.title || 'ไม่มีหัวข้อ'}</h1>
            {form.excerpt && <p className="text-white text-sm mb-4 italic">{form.excerpt}</p>}
            <div className="prose prose-invert max-w-none text-[#CBD5E1] text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: form.content || '<p class="text-[#475569]">ยังไม่มีเนื้อหา</p>' }}
            />
          </div>
        )}

        {/* SEO tab (mobile) */}
        {tab === 'seo' && (
          <div className="lg:hidden">
            <SeoPanel form={form} set={set} checks={checks} score={score} color={color}
              seoTitleLen={seoTitleLen} metaDescLen={metaDescLen} />
          </div>
        )}

        {/* Excerpt + Cover */}
        <div className="glass p-5 space-y-4">
          <p className="text-sm text-white uppercase tracking-widest font-semibold">รูปภาพและบทสรุป</p>

          {/* Cover image */}
          <div className="space-y-2">
            <label className="text-sm text-white uppercase tracking-widest">Cover Image</label>
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'cover_image')} />
            {form.cover_image ? (
              <div className="relative rounded-xl overflow-hidden bg-[rgba(255,255,255,0.03)] border border-[rgba(139,92,246,0.2)]">
                <img src={form.cover_image} alt="cover" className="w-full max-h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button type="button" onClick={() => coverRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm transition-all flex items-center gap-1.5">
                    <BsUpload size={12} /> เปลี่ยน
                  </button>
                  <button type="button" onClick={() => set('cover_image', '')}
                    className="w-7 h-7 rounded-lg bg-black/60 text-white hover:bg-rose-600/80 backdrop-blur-sm transition-all flex items-center justify-center">
                    <BsX size={15} />
                  </button>
                </div>
                {imgUploading.cover_image && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-sm text-white">กำลังอัปโหลด...</div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={form.cover_image} onChange={e => set('cover_image', e.target.value)}
                  placeholder="https://example.com/image.jpg หรืออัปโหลด →"
                  className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] outline-none placeholder-[#334155] transition-colors" />
                <button type="button" onClick={() => coverRef.current?.click()} disabled={imgUploading.cover_image}
                  className="shrink-0 px-3 py-2.5 rounded-xl border border-[rgba(139,92,246,0.3)] text-white hover:bg-[rgba(139,92,246,0.15)] transition-all flex items-center gap-1.5 text-sm disabled:opacity-50">
                  <BsUpload size={14} /> {imgUploading.cover_image ? '...' : 'อัปโหลด'}
                </button>
              </div>
            )}
          </div>

          {/* OG image */}
          <div className="space-y-2">
            <label className="text-sm text-white uppercase tracking-widest">OG Image (ถ้าต่างจาก cover)</label>
            <input ref={ogRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'og_image')} />
            <div className="flex gap-2">
              <input value={form.og_image} onChange={e => set('og_image', e.target.value)}
                placeholder="https://... หรืออัปโหลด →"
                className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] outline-none placeholder-[#334155] transition-colors" />
              <button type="button" onClick={() => ogRef.current?.click()} disabled={imgUploading.og_image}
                className="shrink-0 px-3 py-2.5 rounded-xl border border-[rgba(139,92,246,0.3)] text-white hover:bg-[rgba(139,92,246,0.15)] transition-all flex items-center gap-1.5 text-sm disabled:opacity-50">
                <BsUpload size={14} /> {imgUploading.og_image ? '...' : 'อัปโหลด'}
              </button>
            </div>
            {form.og_image && (
              <img src={form.og_image} alt="og" className="w-full max-h-24 object-cover rounded-lg opacity-70" />
            )}
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-sm text-white uppercase tracking-widest">บทสรุปย่อ (แสดงในรายการบทความ)</label>
            <input value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
              placeholder="สรุปสั้นๆ 1-2 ประโยค..."
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] outline-none placeholder-[#334155] transition-colors" />
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3 pb-6">
          <button onClick={() => save(false)} disabled={saving}
            className="glass-tab flex-1 py-3 text-sm text-white hover:text-[#c4b5fd] disabled:opacity-50">
            บันทึกเป็นร่าง
          </button>
          <button onClick={() => save(true)} disabled={saving}
            className="btn-primary flex-1 py-3 text-sm font-bold disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : postId ? 'อัปเดต' : 'เผยแพร่'}
          </button>
        </div>
      </div>

      {/* ===== RIGHT: SEO panel (desktop) ===== */}
      <div className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-6">
        <SeoPanel form={form} set={set} checks={checks} score={score} color={color}
          seoTitleLen={seoTitleLen} metaDescLen={metaDescLen} />
      </div>
    </div>
  );
}

// ---- SEO Panel ----
function SeoPanel({ form, set, checks, score, color, seoTitleLen, metaDescLen }: {
  form: BlogForm;
  set: (k: keyof BlogForm, v: string) => void;
  checks: SeoCheck[];
  score: number; color: string;
  seoTitleLen: number; metaDescLen: number;
}) {
  const scoreLabel = score >= 70 ? 'ดี' : score >= 40 ? 'พอใช้' : 'ควรปรับปรุง';

  return (
    <>
      {/* Score */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <BsGraphUp size={11} /> SEO Score
          </p>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}>
            {scoreLabel} {score}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, background: color }} />
        </div>
        {/* Checklist */}
        <div className="space-y-1.5 mt-1">
          {checks.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {c.pass === null
                ? <BsDashCircle size={13} className="text-[#94A3B8] shrink-0 mt-0.5" />
                : c.pass
                  ? <BsCheck2Circle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  : <BsXCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />}
              <span className={c.pass === true ? 'text-white' : c.pass === false ? 'text-rose-400/80' : 'text-white/60'}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Focus keyword */}
      <div className="glass p-4 space-y-3">
        <p className="text-sm text-white uppercase tracking-widest font-semibold">Focus Keyword</p>
        <input value={form.focus_keyword} onChange={e => set('focus_keyword', e.target.value)}
          placeholder="คีย์เวิร์ดหลัก เช่น buy instagram followers"
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#334155] transition-colors" />
      </div>

      {/* SEO title */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white uppercase tracking-widest font-semibold">SEO Title</p>
          <span className="text-[10px] font-mono" style={{ color: counterColor(seoTitleLen, 10, 60) }}>
            {seoTitleLen}/60
          </span>
        </div>
        <input value={form.meta_title} onChange={e => set('meta_title', e.target.value)}
          placeholder={form.title || 'ปล่อยว่างเพื่อใช้ชื่อบทความ'}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#334155] transition-colors" />
        {/* Google preview */}
        <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3 space-y-0.5 border border-[rgba(139,92,246,0.08)]">
          <p className="text-sm text-white uppercase tracking-widest mb-1">ตัวอย่างใน Google</p>
          <p className="text-[#4285f4] text-sm font-medium truncate">{form.meta_title || form.title || 'SEO Title'}</p>
          <p className="text-[#006621] text-[11px]">yoursite.com/blog/{form.slug || 'slug'}</p>
          <p className="text-[#545454] text-[11px] leading-relaxed line-clamp-2">{form.meta_description || 'Meta description จะแสดงตรงนี้...'}</p>
        </div>
      </div>

      {/* Meta description */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white uppercase tracking-widest font-semibold">Meta Description</p>
          <span className="text-[10px] font-mono" style={{ color: counterColor(metaDescLen, 50, 155) }}>
            {metaDescLen}/155
          </span>
        </div>
        <textarea value={form.meta_description} onChange={e => set('meta_description', e.target.value)}
          rows={3} placeholder="อธิบายบทความใน 1-2 ประโยค ให้คนอยากคลิก..."
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#334155] transition-colors resize-none" />
      </div>
    </>
  );
}
