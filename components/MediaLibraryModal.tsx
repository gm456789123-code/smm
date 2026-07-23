'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BsUpload, BsX, BsCheck, BsCheck2, BsCheckLg, BsImage, BsSearch,
} from 'react-icons/bs';

export interface MediaItem {
  name: string;
  url: string;
  size: number;
  mtime: string;
  alt_text: string;
  title: string;
  caption: string;
  description: string;
}

export interface MediaPickResult {
  url: string;
  alt: string;
  title: string;
  caption: string;
  description: string;
  name: string;
  /** used when inserting into content editor */
  width?: string;
  align?: string;
}

type Mode = 'insert' | 'pick';

interface Props {
  onSelect: (item: MediaPickResult) => void;
  onClose: () => void;
  /** insert = for content (width/align); pick = cover/og (URL only) */
  mode?: Mode;
  title?: string;
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

export default function MediaLibraryModal({
  onSelect,
  onClose,
  mode = 'insert',
  title = 'คลังภาพ',
}: Props) {
  const [items, setItems]         = useState<MediaItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected]   = useState<MediaItem | null>(null);
  const [form, setForm]           = useState({ alt_text: '', title: '', caption: '', description: '' });
  const [saving, setSaving]       = useState(false);
  const [savedOk, setSavedOk]     = useState(false);
  const [q, setQ]                 = useState('');
  const [width, setWidth]         = useState('100%');
  const [align, setAlign]         = useState('none');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function select(item: MediaItem) {
    setSelected(item);
    setForm({
      alt_text: item.alt_text,
      title: item.title,
      caption: item.caption,
      description: item.description,
    });
    setSavedOk(false);
  }

  async function upload(files: FileList | File[]) {
    setUploading(true);
    try {
      const list = Array.from(files);
      let lastUrl = '';
      for (const file of list) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const d = await res.json();
        if (d.url) lastUrl = d.url as string;
      }
      await load();
      // auto-select the newest uploaded file
      if (lastUrl) {
        const res = await fetch('/api/admin/media');
        const data: MediaItem[] = await res.json();
        const found = Array.isArray(data) ? data.find(i => i.url === lastUrl) : undefined;
        if (found) select(found);
        else if (Array.isArray(data) && data[0]) select(data[0]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function saveMeta() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selected.name, ...form }),
      });
      setItems(prev => prev.map(i => i.name === selected.name ? { ...i, ...form } : i));
      setSelected(s => s ? { ...s, ...form } : null);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function confirm() {
    if (!selected) return;
    // persist any unsaved SEO edits before insert
    const payload: MediaPickResult = {
      url: selected.url,
      name: selected.name,
      alt: form.alt_text || selected.alt_text || '',
      title: form.title || selected.title || '',
      caption: form.caption || selected.caption || '',
      description: form.description || selected.description || '',
      width: mode === 'insert' ? width : undefined,
      align: mode === 'insert' ? align : undefined,
    };
    // fire-and-forget save so SEO stays in sync
    if (
      form.alt_text !== selected.alt_text ||
      form.title !== selected.title ||
      form.caption !== selected.caption ||
      form.description !== selected.description
    ) {
      fetch('/api/admin/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selected.name, ...form }),
      }).catch(() => null);
    }
    onSelect(payload);
  }

  const filtered = q.trim()
    ? items.filter(i => {
        const s = q.toLowerCase();
        return (
          i.name.toLowerCase().includes(s) ||
          i.alt_text.toLowerCase().includes(s) ||
          i.title.toLowerCase().includes(s) ||
          i.caption.toLowerCase().includes(s)
        );
      })
    : items;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-5xl h-[min(90vh,820px)] flex flex-col rounded-2xl overflow-hidden border border-[rgba(139,92,246,0.35)] shadow-2xl"
        style={{ background: 'rgba(13,18,32,0.98)' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[rgba(139,92,246,0.2)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <BsImage className="text-[#a78bfa] shrink-0" size={18} />
            <h3 className="text-white font-semibold truncate">{title}</h3>
            <span className="text-xs text-white/40 hidden sm:inline">{items.length} ไฟล์</span>
          </div>
          <div className="flex-1 max-w-xs ml-auto relative">
            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={12} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ / alt / title..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(139,92,246,0.2)] text-white outline-none focus:border-[rgba(139,92,246,0.5)] placeholder:text-white/30"
            />
          </div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/5" aria-label="ปิด">
            <BsX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
          {/* Grid + upload */}
          <div className="flex-1 min-w-0 flex flex-col border-b sm:border-b-0 sm:border-r border-[rgba(139,92,246,0.15)]">
            {/* Upload bar */}
            <div className="px-4 py-3 flex items-center gap-2 border-b border-[rgba(139,92,246,0.1)] shrink-0">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => e.target.files?.length && upload(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(139,92,246,0.25)] hover:bg-[rgba(139,92,246,0.4)] text-[#c4b5fd] border border-[rgba(139,92,246,0.35)] transition-all disabled:opacity-50"
              >
                <BsUpload size={12} />
                {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพใหม่'}
              </button>
              <p className="text-[11px] text-white/35 hidden sm:block">jpg, png, gif, webp — สูงสุด 5 MB</p>
            </div>

            {/* Grid */}
            <div
              className="flex-1 overflow-y-auto p-3 sm:p-4"
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
              }}
              onDragOver={e => e.preventDefault()}
            >
              {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center gap-2 py-10">
                  <BsImage size={36} className="text-white/20" />
                  <p className="text-white/40 text-sm">{q ? 'ไม่พบภาพที่ค้นหา' : 'ยังไม่มีภาพในคลัง'}</p>
                  {!q && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="mt-2 text-xs text-[#a78bfa] hover:text-white underline-offset-2 hover:underline"
                    >
                      อัปโหลดภาพแรก
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {filtered.map(item => {
                    const active = selected?.name === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => select(item)}
                        className={[
                          'relative aspect-square rounded-xl overflow-hidden border-2 transition-all group',
                          active
                            ? 'border-[#a78bfa] shadow-[0_0_0_3px_rgba(167,139,250,0.25)]'
                            : 'border-transparent hover:border-[rgba(139,92,246,0.45)]',
                        ].join(' ')}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.alt_text || item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.alt_text ? (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow" title="มี Alt text">
                            <BsCheck2 size={9} className="text-white" />
                          </span>
                        ) : (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500/90 flex items-center justify-center shadow" title="ยังไม่มี Alt text">
                            <span className="text-[8px] font-bold text-black">!</span>
                          </span>
                        )}
                        {active && (
                          <div className="absolute inset-0 bg-[rgba(139,92,246,0.25)] flex items-center justify-center">
                            <span className="w-7 h-7 rounded-full bg-[#8B5CF6] flex items-center justify-center shadow-lg">
                              <BsCheck size={16} className="text-white" />
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail / SEO panel */}
          <div className="w-full sm:w-80 shrink-0 flex flex-col max-h-[45vh] sm:max-h-none overflow-y-auto bg-[rgba(0,0,0,0.15)]">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
                <BsImage size={32} className="text-white/15" />
                <p className="text-sm text-white/40">เลือกภาพจากคลัง<br />เพื่อดูและแก้ข้อมูล SEO</p>
              </div>
            ) : (
              <>
                {/* Preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.url}
                  alt={form.alt_text || selected.name}
                  className="w-full max-h-40 object-contain bg-black/30 p-2 shrink-0"
                />
                <div className="px-4 py-2 flex gap-3 text-[11px] text-white/40 border-b border-[rgba(139,92,246,0.1)] shrink-0">
                  <span className="truncate flex-1" title={selected.name}>{selected.name}</span>
                  <span className="shrink-0">{fmtSize(selected.size)}</span>
                </div>

                <div className="p-4 space-y-3 flex-1">
                  <p className="text-[11px] font-semibold text-[#a78bfa] uppercase tracking-wider">ข้อมูล SEO ภาพ</p>

                  {(['alt_text', 'title', 'caption', 'description'] as const).map(field => (
                    <div key={field} className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-white/55">
                          {field === 'alt_text' ? 'Alt Text' : field === 'title' ? 'Title' : field === 'caption' ? 'Caption' : 'Description'}
                        </label>
                        <span className={[
                          'text-[9px] px-1.5 py-0.5 rounded-full font-semibold',
                          field === 'alt_text' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[rgba(139,92,246,0.15)] text-[#a78bfa]',
                        ].join(' ')}>
                          {field === 'alt_text' ? '★ สำคัญ' : 'SEO'}
                        </span>
                      </div>
                      {field === 'caption' || field === 'description' ? (
                        <textarea
                          value={form[field]}
                          rows={2}
                          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                          placeholder={SEO_TIPS[field]}
                          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none resize-none placeholder:text-white/25"
                        />
                      ) : (
                        <input
                          value={form[field]}
                          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                          placeholder={field === 'alt_text' ? 'เช่น SMM Panel ราคาถูก ไทย' : 'เช่น AURA SMM Panel'}
                          className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/25"
                        />
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={saveMeta}
                    disabled={saving}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-[rgba(139,92,246,0.35)] hover:bg-[rgba(139,92,246,0.55)] text-white border border-[rgba(139,92,246,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {savedOk
                      ? <><BsCheckLg size={12} className="text-emerald-300" /> บันทึก SEO แล้ว</>
                      : saving ? 'กำลังบันทึก...' : 'บันทึก SEO'}
                  </button>

                  {mode === 'insert' && (
                    <div className="pt-2 border-t border-[rgba(139,92,246,0.12)] space-y-2">
                      <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">การแสดงในบทความ</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-white/40">ความกว้าง</label>
                          <input
                            value={width}
                            onChange={e => setWidth(e.target.value)}
                            placeholder="100% หรือ 600px"
                            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(139,92,246,0.2)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-white/40">จัดวาง</label>
                          <select
                            value={align}
                            onChange={e => setAlign(e.target.value)}
                            className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(139,92,246,0.2)] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                          >
                            <option value="none">ปกติ</option>
                            <option value="left">ซ้าย</option>
                            <option value="center">กลาง</option>
                            <option value="right">ขวา</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-[rgba(139,92,246,0.2)] shrink-0 bg-[rgba(0,0,0,0.2)]">
          <p className="text-[11px] text-white/35 truncate min-w-0">
            {selected
              ? (form.alt_text
                  ? `Alt: ${form.alt_text}`
                  : '⚠ ยังไม่มี Alt text — แนะนำให้ใส่เพื่อ SEO')
              : 'เลือกภาพแล้วกดปุ่มด้านขวา'}
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 hover:text-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!selected}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[rgba(139,92,246,0.85)] hover:bg-[rgba(139,92,246,1)] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <BsCheck size={16} />
              {mode === 'insert' ? 'แทรกภาพ' : 'เลือกภาพนี้'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
