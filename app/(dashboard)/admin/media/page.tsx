'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BsUpload, BsTrash, BsClipboard, BsCheckLg, BsImage } from 'react-icons/bs';

interface MediaItem { name: string; url: string; size: number; mtime: string }

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [items,     setItems]     = useState<MediaItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied,    setCopied]    = useState<string | null>(null);
  const [selected,  setSelected]  = useState<MediaItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/media');
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function upload(files: FileList) {
    setUploading(true);
    try {
      await Promise.all(Array.from(files).map(async file => {
        const fd = new FormData();
        fd.append('file', file);
        await fetch('/api/admin/upload', { method: 'POST', body: fd });
      }));
      await load();
    } finally { setUploading(false); }
  }

  async function del(item: MediaItem) {
    if (!confirm(`ลบ ${item.name}?`)) return;
    await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: item.name }),
    });
    if (selected?.name === item.name) setSelected(null);
    await load();
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">คลังภาพ</h1>
        <span className="text-sm text-white/40">{items.length} ไฟล์</span>
      </div>

      {/* Upload zone */}
      <div
        onDrop={onDrop} onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="glass border-2 border-dashed border-[rgba(139,92,246,0.3)] hover:border-[rgba(139,92,246,0.6)] rounded-2xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-all group">
        <BsUpload size={28} className="text-[#a78bfa] group-hover:scale-110 transition-transform" />
        <p className="text-white font-medium">
          {uploading ? 'กำลังอัปโหลด...' : 'คลิกหรือลากไฟล์มาวางที่นี่'}
        </p>
        <p className="text-white/40 text-xs">jpg, png, gif, webp, svg — สูงสุด 5 MB ต่อไฟล์</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => e.target.files?.length && upload(e.target.files)} />
      </div>

      <div className="flex gap-5 items-start">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square glass rounded-xl animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="glass p-12 rounded-2xl text-center">
              <BsImage size={40} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40">ยังไม่มีภาพในคลัง</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {items.map(item => (
                <button key={item.name} type="button"
                  onClick={() => setSelected(s => s?.name === item.name ? null : item)}
                  className={[
                    'relative aspect-square rounded-xl overflow-hidden border-2 transition-all group',
                    selected?.name === item.name
                      ? 'border-[#a78bfa] shadow-[0_0_0_3px_rgba(167,139,250,0.25)]'
                      : 'border-transparent hover:border-[rgba(139,92,246,0.4)]',
                  ].join(' ')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.name}
                    className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 shrink-0 glass rounded-2xl p-4 space-y-3 sticky top-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.url} alt={selected.name}
              className="w-full rounded-xl object-contain max-h-48 bg-[rgba(255,255,255,0.03)]" />
            <div className="space-y-1">
              <p className="text-white text-sm font-medium break-all">{selected.name}</p>
              <p className="text-white/40 text-xs">{fmtSize(selected.size)}</p>
              <p className="text-white/30 text-xs">{new Date(selected.mtime).toLocaleString('th-TH')}</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => copy(selected.url)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-white border border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.15)] transition-all">
                {copied === selected.url ? <><BsCheckLg size={13} className="text-emerald-400" /> คัดลอกแล้ว</> : <><BsClipboard size={13} /> คัดลอก URL</>}
              </button>
              <button onClick={() => del(selected)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-all">
                <BsTrash size={13} /> ลบ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
