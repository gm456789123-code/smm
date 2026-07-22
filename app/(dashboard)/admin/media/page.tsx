'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BsUpload, BsTrash, BsClipboard, BsCheckLg, BsImage, BsX, BsCheck2 } from 'react-icons/bs';

interface MediaItem {
  name: string; url: string; size: number; mtime: string;
  alt_text: string; title: string; caption: string; description: string;
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const SEO_TIPS: Record<string, string> = {
  alt_text:    'สำคัญที่สุด — บอก Google ว่าภาพนี้คือภาพอะไร ใส่ keyword หลักได้',
  title:       'ชื่อภาพที่แสดงตอน hover ใส่ keyword รอง',
  caption:     'ข้อความใต้ภาพในบทความ ช่วยให้ผู้อ่านเข้าใจบริบท',
  description: 'คำอธิบายละเอียดสำหรับ screen reader และ search bot',
};

export default function MediaPage() {
  const [items,     setItems]     = useState<MediaItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied,    setCopied]    = useState<string | null>(null);
  const [selected,  setSelected]  = useState<MediaItem | null>(null);
  const [form,      setForm]      = useState({ alt_text: '', title: '', caption: '', description: '' });
  const [saving,    setSaving]    = useState(false);
  const [savedOk,   setSavedOk]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/media');
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function select(item: MediaItem) {
    setSelected(item);
    setForm({ alt_text: item.alt_text, title: item.title, caption: item.caption, description: item.description });
    setSavedOk(false);
  }

  async function upload(files: FileList) {
    setUploading(true);
    try {
      await Promise.all(Array.from(files).map(async file => {
        const fd = new FormData(); fd.append('file', file);
        await fetch('/api/admin/upload', { method: 'POST', body: fd });
      }));
      await load();
    } finally { setUploading(false); }
  }

  async function saveMeta() {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/admin/media', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: selected.name, ...form }),
    });
    setSaving(false);
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
    setItems(prev => prev.map(i => i.name === selected.name ? { ...i, ...form } : i));
    setSelected(s => s ? { ...s, ...form } : null);
  }

  async function del(item: MediaItem) {
    if (!confirm(`ลบ ${item.name}?`)) return;
    await fetch('/api/admin/media', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name }),
    });
    if (selected?.name === item.name) setSelected(null);
    await load();
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url); setTimeout(() => setCopied(null), 2000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">คลังภาพ</h1>
        <span className="text-sm text-[#94A3B8]">{items.length} ไฟล์</span>
      </div>

      {/* Upload zone */}
      <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => fileRef.current?.click()}
        className="glass border-2 border-dashed border-[rgba(139,92,246,0.3)] hover:border-[rgba(139,92,246,0.6)] rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all group">
        <BsUpload size={28} className="text-[#a78bfa] group-hover:scale-110 transition-transform" />
        <p className="text-white font-medium">{uploading ? 'กำลังอัปโหลด...' : 'คลิกหรือลากไฟล์มาวางที่นี่'}</p>
        <p className="text-[#94A3B8] text-xs">jpg, png, gif, webp, svg — สูงสุด 5 MB ต่อไฟล์</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files?.length && upload(e.target.files)} />
      </div>

      <div className="flex gap-5 items-start">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square glass rounded-xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="glass p-12 rounded-2xl text-center">
              <BsImage size={40} className="text-[#94A3B8] mx-auto mb-3" />
              <p className="text-[#94A3B8]">ยังไม่มีภาพในคลัง</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {items.map(item => (
                <button key={item.name} type="button" onClick={() => select(item)}
                  className={['relative aspect-square rounded-xl overflow-hidden border-2 transition-all group',
                    selected?.name === item.name
                      ? 'border-[#a78bfa] shadow-[0_0_0_3px_rgba(167,139,250,0.25)]'
                      : 'border-transparent hover:border-[rgba(139,92,246,0.4)]',
                  ].join(' ')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt_text || item.name} className="w-full h-full object-cover" />
                  {/* Green dot = has alt text */}
                  {item.alt_text && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                      <BsCheck2 size={9} className="text-white" />
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SEO detail panel */}
        {selected && (
          <div className="w-72 shrink-0 glass rounded-2xl overflow-hidden sticky top-6">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(139,92,246,0.15)]">
              <p className="text-sm font-semibold text-white truncate pr-2">{selected.name}</p>
              <button onClick={() => setSelected(null)} className="text-[#94A3B8] hover:text-white shrink-0"><BsX size={18} /></button>
            </div>

            {/* Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.alt_text || selected.name}
              className="w-full max-h-44 object-contain bg-[rgba(0,0,0,0.2)] p-2" />

            {/* File info */}
            <div className="px-4 py-2 flex gap-4 text-xs text-[#94A3B8] border-b border-[rgba(139,92,246,0.1)]">
              <span>{fmtSize(selected.size)}</span>
              <span>{new Date(selected.mtime).toLocaleDateString('th-TH')}</span>
            </div>

            {/* SEO fields */}
            <div className="p-4 space-y-3">
              <p className="text-xs font-semibold text-[#a78bfa] uppercase tracking-wider">ข้อมูล SEO ภาพ</p>

              {(['alt_text', 'title', 'caption', 'description'] as const).map(field => (
                <div key={field} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-[#94A3B8]">
                      {field === 'alt_text' ? 'Alt Text' : field === 'title' ? 'Title' : field === 'caption' ? 'Caption' : 'Description'}
                    </label>
                    <span className={['text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
                      field === 'alt_text' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[rgba(139,92,246,0.15)] text-[#a78bfa]'
                    ].join(' ')}>
                      {field === 'alt_text' ? '⭐ สำคัญมาก' : 'SEO'}
                    </span>
                  </div>
                  {field === 'caption' || field === 'description' ? (
                    <textarea value={form[field]} rows={2}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none resize-none placeholder-[#94A3B8]"
                      placeholder={SEO_TIPS[field]} />
                  ) : (
                    <input value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={field === 'alt_text' ? 'เช่น SMM Panel ราคาถูก ไทย' : 'เช่น AURA SMM Panel'}
                      className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none placeholder-[#94A3B8]" />
                  )}
                  <p className="text-[10px] text-[#94A3B8] leading-relaxed">{SEO_TIPS[field]}</p>
                </div>
              ))}

              <button onClick={saveMeta} disabled={saving}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-[rgba(139,92,246,0.7)] hover:bg-[rgba(139,92,246,0.9)] text-white transition-all disabled:opacity-50 flex items-center justify-center gap-1.5">
                {savedOk ? <><BsCheckLg size={12} className="text-emerald-300" /> บันทึกแล้ว</> : saving ? 'กำลังบันทึก...' : 'บันทึก SEO'}
              </button>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={() => copy(selected.url)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-white border border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.15)] transition-all">
                {copied === selected.url ? <><BsCheckLg size={11} className="text-emerald-400" /> คัดลอกแล้ว</> : <><BsClipboard size={11} /> คัดลอก URL</>}
              </button>
              <button onClick={() => del(selected)}
                className="py-2 px-3 rounded-xl text-xs text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-all">
                <BsTrash size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
