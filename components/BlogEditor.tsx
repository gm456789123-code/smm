'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BsCheck2Circle, BsXCircle, BsDashCircle,
  BsEye, BsPencilSquare, BsSearch,
  BsCodeSlash, BsPencil, BsGraphUp,
} from 'react-icons/bs';

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

// ---- HTML toolbar ----
const TOOLBAR = [
  { label: 'H1', wrap: '<h1>$</h1>' },
  { label: 'H2', wrap: '<h2>$</h2>' },
  { label: 'H3', wrap: '<h3>$</h3>' },
  { label: 'B',  wrap: '<strong>$</strong>' },
  { label: 'I',  wrap: '<em>$</em>' },
  { label: 'U',  wrap: '<u>$</u>' },
  { label: 'A',  wrap: '<a href="URL">$</a>' },
  { label: 'IMG',wrap: '<img src="URL" alt="$" />' },
  { label: 'P',  wrap: '<p>$</p>' },
  { label: 'UL', wrap: '<ul>\n  <li>$</li>\n</ul>' },
  { label: 'OL', wrap: '<ol>\n  <li>$</li>\n</ol>' },
  { label: 'BQ', wrap: '<blockquote>$</blockquote>' },
  { label: 'CODE', wrap: '<code>$</code>' },
  { label: 'PRE', wrap: '<pre><code>$</code></pre>' },
  { label: 'HR', wrap: '\n<hr />\n$' },
];

function insertTag(
  textarea: HTMLTextAreaElement,
  wrap: string,
  setValue: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end   = textarea.selectionEnd;
  const sel   = textarea.value.slice(start, end) || 'ข้อความ';
  const inserted = wrap.replace('$', sel);
  const next = textarea.value.slice(0, start) + inserted + textarea.value.slice(end);
  setValue(next);
  setTimeout(() => {
    const cursor = start + inserted.length;
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
  }, 0);
}

// ---- char counter color ----
function counterColor(len: number, min: number, max: number) {
  if (len === 0) return '#475569';
  if (len < min) return '#f59e0b';
  if (len > max) return '#ef4444';
  return '#22c55e';
}

// ---- plain ↔ html conversion ----
function plainToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => `<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---- main component ----
interface Props { initial?: BlogForm; postId?: number }

export default function BlogEditor({ initial, postId }: Props) {
  const router  = useRouter();
  const [form,  setForm]   = useState<BlogForm>(initial ?? EMPTY);
  const [tab,   setTab]    = useState<'write' | 'preview' | 'seo'>('write');
  const [htmlMode, setHtmlMode] = useState(false);
  const [saving, setSave]  = useState(false);
  const [error,  setError] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  const { checks, score, color } = useSeoChecks(form);

  function toSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9ก-๙\s-]/g, '').replace(/\s+/g, '-').slice(0, 100);
  }

  const set = useCallback((k: keyof BlogForm, v: string) =>
    setForm(p => ({ ...p, [k]: v })), []);

  function handleTitle(v: string) {
    setForm(p => ({ ...p, title: v, slug: p.slug || toSlug(v) }));
  }

  function handleContent(v: string) { set('content', v); }

  async function save(published: boolean) {
    setSave(true); setError('');
    const url    = postId ? `/api/admin/blog/${postId}` : '/api/admin/blog';
    const method = postId ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, published: published ? 1 : 0 }),
    });
    const d = await res.json();
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
            <label className="text-[10px] text-[#475569] uppercase tracking-widest">หัวข้อบทความ *</label>
            <input value={form.title} onChange={e => handleTitle(e.target.value)}
              placeholder="หัวข้อที่ดึงดูดผู้อ่าน..."
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-4 py-3 text-lg font-semibold text-white outline-none placeholder-[#334155] transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#475569] uppercase tracking-widest">Slug (URL)</label>
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(139,92,246,0.15)] rounded-xl px-4 py-2.5">
              <span className="text-[#334155] text-sm shrink-0">/blog/</span>
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
                tab === k ? 'glass-tab-active text-[#c4b5fd]' : 'text-[#94A3B8]'].join(' ')}>
              {icon}{l}
            </button>
          ))}
        </div>

        {/* Write tab */}
        {tab === 'write' && (
          <div className="glass overflow-hidden">
            {/* Toolbar row */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[rgba(139,92,246,0.1)]">
              {htmlMode ? (
                <div className="flex flex-wrap gap-1 flex-1">
                  {TOOLBAR.map(t => (
                    <button key={t.label} type="button"
                      onClick={() => taRef.current && insertTag(taRef.current, t.wrap, v => set('content', v))}
                      className="px-2.5 py-1 text-xs font-mono font-semibold text-[#94A3B8] hover:text-white bg-[rgba(139,92,246,0.06)] hover:bg-[rgba(139,92,246,0.15)] rounded-lg transition-all">
                      {t.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#475569] flex-1">เขียนปกติ — กด Enter 2 ครั้งเพื่อขึ้นย่อหน้าใหม่</span>
              )}
              {/* Mode toggle */}
              <button type="button"
                onClick={() => {
                  if (htmlMode) {
                    set('content', htmlToPlain(form.content));
                  } else {
                    set('content', plainToHtml(form.content));
                  }
                  setHtmlMode(m => !m);
                }}
                className={[
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  htmlMode
                    ? 'bg-[rgba(139,92,246,0.2)] text-[#a78bfa] border border-[rgba(139,92,246,0.4)]'
                    : 'bg-[rgba(255,255,255,0.05)] text-[#64748B] border border-[rgba(255,255,255,0.08)] hover:text-white',
                ].join(' ')}>
                {htmlMode
                  ? <><BsCodeSlash size={13} /> HTML</>
                  : <><BsPencil size={13} /> ปกติ</>
                }
              </button>
            </div>

            {htmlMode ? (
              <textarea ref={taRef} value={form.content} onChange={e => handleContent(e.target.value)}
                placeholder={'<h2>หัวข้อย่อย</h2>\n<p>เนื้อหาบทความ...</p>'}
                rows={22}
                className="w-full bg-transparent px-4 py-3 text-sm text-[#F1F5F9] font-mono outline-none placeholder-[#334155] resize-y leading-relaxed"
              />
            ) : (
              <textarea value={form.content} onChange={e => handleContent(e.target.value)}
                placeholder={'เริ่มเขียนบทความที่นี่...\n\nกด Enter 2 ครั้งเพื่อขึ้นย่อหน้าใหม่'}
                rows={22}
                className="w-full bg-transparent px-4 py-3 text-sm text-[#F1F5F9] outline-none placeholder-[#334155] resize-y leading-relaxed"
              />
            )}

            <div className="px-4 py-2 border-t border-[rgba(139,92,246,0.08)] flex justify-between text-[10px] text-[#334155]">
              <span>{countWords(form.content).toLocaleString()} คำ</span>
              <span>{form.content.length.toLocaleString()} ตัวอักษร</span>
            </div>
          </div>
        )}

        {/* Preview tab */}
        {tab === 'preview' && (
          <div className="glass p-6">
            {form.cover_image && (
              <img src={form.cover_image} alt="" className="w-full rounded-xl mb-6 max-h-64 object-cover" />
            )}
            <h1 className="text-2xl font-bold text-white mb-2">{form.title || 'ไม่มีหัวข้อ'}</h1>
            {form.excerpt && <p className="text-[#94A3B8] text-sm mb-4 italic">{form.excerpt}</p>}
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
          <p className="text-xs text-[#475569] uppercase tracking-widest font-semibold">รูปภาพและบทสรุป</p>
          {[
            { key: 'cover_image', label: 'Cover Image URL', ph: 'https://example.com/image.jpg' },
            { key: 'og_image',    label: 'OG Image URL (ถ้าต่างจาก cover)', ph: 'https://...' },
            { key: 'excerpt',     label: 'บทสรุปย่อ (แสดงในรายการบทความ)', ph: 'สรุปสั้นๆ 1-2 ประโยค...' },
          ].map(f => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-[10px] text-[#475569] uppercase tracking-widest">{f.label}</label>
              <input value={form[f.key as keyof BlogForm]} onChange={e => set(f.key as keyof BlogForm, e.target.value)}
                placeholder={f.ph}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] rounded-xl px-4 py-2.5 text-sm text-[#F1F5F9] outline-none placeholder-[#334155] transition-colors" />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex gap-3 pb-6">
          <button onClick={() => save(false)} disabled={saving}
            className="glass-tab flex-1 py-3 text-sm text-[#94A3B8] hover:text-white disabled:opacity-50">
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
          <p className="text-xs text-[#475569] uppercase tracking-widest font-semibold flex items-center gap-1.5">
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
                ? <BsDashCircle size={13} className="text-[#475569] shrink-0 mt-0.5" />
                : c.pass
                  ? <BsCheck2Circle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                  : <BsXCircle size={13} className="text-rose-400 shrink-0 mt-0.5" />}
              <span className={c.pass === true ? 'text-[#94A3B8]' : c.pass === false ? 'text-rose-400/80' : 'text-[#475569]'}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Focus keyword */}
      <div className="glass p-4 space-y-3">
        <p className="text-xs text-[#475569] uppercase tracking-widest font-semibold">Focus Keyword</p>
        <input value={form.focus_keyword} onChange={e => set('focus_keyword', e.target.value)}
          placeholder="คีย์เวิร์ดหลัก เช่น buy instagram followers"
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#334155] transition-colors" />
      </div>

      {/* SEO title */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#475569] uppercase tracking-widest font-semibold">SEO Title</p>
          <span className="text-[10px] font-mono" style={{ color: counterColor(seoTitleLen, 10, 60) }}>
            {seoTitleLen}/60
          </span>
        </div>
        <input value={form.meta_title} onChange={e => set('meta_title', e.target.value)}
          placeholder={form.title || 'ปล่อยว่างเพื่อใช้ชื่อบทความ'}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder-[#334155] transition-colors" />
        {/* Google preview */}
        <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3 space-y-0.5 border border-[rgba(139,92,246,0.08)]">
          <p className="text-[11px] text-[#475569] uppercase tracking-widest mb-1">ตัวอย่างใน Google</p>
          <p className="text-[#4285f4] text-sm font-medium truncate">{form.meta_title || form.title || 'SEO Title'}</p>
          <p className="text-[#006621] text-[11px]">yoursite.com/blog/{form.slug || 'slug'}</p>
          <p className="text-[#545454] text-[11px] leading-relaxed line-clamp-2">{form.meta_description || 'Meta description จะแสดงตรงนี้...'}</p>
        </div>
      </div>

      {/* Meta description */}
      <div className="glass p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#475569] uppercase tracking-widest font-semibold">Meta Description</p>
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
