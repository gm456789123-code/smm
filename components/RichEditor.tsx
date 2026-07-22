'use client';

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image as TiptapImage } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Youtube } from '@tiptap/extension-youtube';
import { Typography } from '@tiptap/extension-typography';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BsTypeBold, BsTypeItalic, BsTypeUnderline, BsTypeStrikethrough,
  BsListUl, BsListOl, BsBlockquoteLeft, BsCode, BsCodeSquare,
  BsLink45Deg, BsImage, BsTable, BsYoutube, BsTextLeft, BsTextCenter,
  BsTextRight, BsJustify, BsArrowCounterclockwise, BsArrowClockwise,
  BsHighlighter, BsX, BsCheck, BsUpload, BsSlashCircle,
  BsCodeSlash, BsPencil,
} from 'react-icons/bs';

// ---- HTML toolbar tags ----
const HTML_TAGS = [
  { label: 'H1',   wrap: '<h1>$</h1>' },
  { label: 'H2',   wrap: '<h2>$</h2>' },
  { label: 'H3',   wrap: '<h3>$</h3>' },
  { label: 'H4',   wrap: '<h4>$</h4>' },
  { label: 'B',    wrap: '<strong>$</strong>' },
  { label: 'I',    wrap: '<em>$</em>' },
  { label: 'U',    wrap: '<u>$</u>' },
  { label: 'A',    wrap: '<a href="https://" target="_blank">$</a>' },
  { label: 'IMG',  wrap: '<img src="URL" alt="$" style="max-width:100%" />' },
  { label: 'P',    wrap: '<p>$</p>' },
  { label: 'UL',   wrap: '<ul>\n  <li>$</li>\n</ul>' },
  { label: 'OL',   wrap: '<ol>\n  <li>$</li>\n</ol>' },
  { label: 'BQ',   wrap: '<blockquote>$</blockquote>' },
  { label: 'CODE', wrap: '<code>$</code>' },
  { label: 'PRE',  wrap: '<pre><code>$</code></pre>' },
  { label: 'HR',   wrap: '\n<hr />\n$' },
];

function insertHtmlTag(ta: HTMLTextAreaElement, wrap: string, onChange: (v: string) => void) {
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const sel   = ta.value.slice(start, end) || 'ข้อความ';
  const inserted = wrap.replace('$', sel);
  const next = ta.value.slice(0, start) + inserted + ta.value.slice(end);
  onChange(next);
  setTimeout(() => {
    const cursor = start + inserted.length;
    ta.focus();
    ta.setSelectionRange(cursor, cursor);
  }, 0);
}

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// ---- Custom Image NodeView ----
function ImageNodeView({ node, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const { src, alt, style } = node.attrs as { src: string; alt: string; style?: string };

  function parseWidth(s?: string) {
    const m = (s ?? '').match(/width:\s*([^;]+)/);
    return m ? m[1].trim() : '100%';
  }
  function parseAlign(s?: string) {
    if (!s) return 'none';
    if (s.includes('margin:0 auto') || s.includes('margin: 0 auto')) return 'center';
    if (s.includes('float:left') || s.includes('float: left')) return 'left';
    if (s.includes('float:right') || s.includes('float: right')) return 'right';
    return 'none';
  }

  const [editAlt,   setEditAlt]   = useState(alt   ?? '');
  const [editWidth, setEditWidth] = useState(() => parseWidth(style));
  const [editAlign, setEditAlign] = useState(() => parseAlign(style));

  function applyEdit() {
    const parts: string[] = [];
    if (editWidth) parts.push(`width:${editWidth}`);
    if (editAlign === 'center') parts.push('display:block;margin:0 auto');
    if (editAlign === 'left')   parts.push('float:left;margin-right:1em');
    if (editAlign === 'right')  parts.push('float:right;margin-left:1em');
    updateAttributes({ alt: editAlt, style: parts.join(';') || undefined });
    setEditing(false);
  }

  return (
    <NodeViewWrapper className="relative inline-block max-w-full my-2">
      {/* Selected ring */}
      <div className={selected ? 'ring-2 ring-[#a78bfa] ring-offset-2 ring-offset-transparent rounded-xl' : ''}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={style ? Object.fromEntries(style.split(';').filter(Boolean).map(p => { const [k,v] = p.split(':'); return [k.trim().replace(/-([a-z])/g, (_,c) => c.toUpperCase()), v?.trim()]; })) : undefined}
          className="max-w-full rounded-xl block" draggable={false} />
      </div>

      {/* Floating toolbar */}
      {selected && !editing && (
        <div className="absolute -top-9 left-0 flex items-center gap-1 bg-[#1a1530]/95 border border-[rgba(139,92,246,0.4)] rounded-lg px-2 py-1 shadow-xl backdrop-blur-sm z-10">
          <button type="button" onMouseDown={e => { e.preventDefault(); setEditAlt(alt ?? ''); setEditWidth(parseWidth(style)); setEditAlign(parseAlign(style)); setEditing(true); }}
            className="text-xs text-[#a78bfa] hover:text-white px-2 py-0.5 rounded hover:bg-[rgba(139,92,246,0.2)] transition-all flex items-center gap-1">
            <BsPencil size={11} /> แก้ไข
          </button>
          <div className="w-px h-4 bg-white/10" />
          <button type="button" onMouseDown={e => { e.preventDefault(); deleteNode(); }}
            className="text-xs text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10 transition-all flex items-center gap-1">
            <BsX size={14} /> ลบ
          </button>
        </div>
      )}

      {/* Inline edit panel */}
      {selected && editing && (
        <div className="absolute top-full left-0 mt-1 z-20 bg-[#1a1530] border border-[rgba(139,92,246,0.4)] rounded-xl p-3 shadow-xl space-y-2 min-w-72">
          <div className="space-y-1">
            <label className="text-[10px] text-white/50 uppercase tracking-widest">Alt text (SEO)</label>
            <input value={editAlt} onChange={e => setEditAlt(e.target.value)} autoFocus
              placeholder="คำอธิบายรูปภาพ"
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.25)] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[rgba(139,92,246,0.6)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-widest">ขนาด (width)</label>
              <input value={editWidth} onChange={e => setEditWidth(e.target.value)}
                placeholder="100% หรือ 600px"
                className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.25)] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:border-[rgba(139,92,246,0.6)]" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/50 uppercase tracking-widest">การจัด</label>
              <select value={editAlign} onChange={e => setEditAlign(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.25)] rounded-lg px-2.5 py-1.5 text-sm text-white outline-none">
                <option value="none">ปกติ</option>
                <option value="left">ซ้าย</option>
                <option value="center">กลาง</option>
                <option value="right">ขวา</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onMouseDown={e => { e.preventDefault(); setEditing(false); }}
              className="flex-1 py-1.5 rounded-lg text-xs text-white/50 border border-white/10 hover:text-white transition-colors">ยกเลิก</button>
            <button type="button" onMouseDown={e => { e.preventDefault(); applyEdit(); }}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(139,92,246,0.7)] hover:bg-[rgba(139,92,246,1)] text-white transition-colors flex items-center justify-center gap-1">
              <BsCheck size={13} /> บันทึก
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

// ---- Custom Image extension with NodeView ----
const EditableImage = TiptapImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

// ---- Link modal ----
function LinkModal({ onConfirm, onClose, initial }: {
  onConfirm: (href: string, target: string, title: string) => void;
  onClose: () => void;
  initial?: { href: string; target: string; title: string };
}) {
  const [href,   setHref]   = useState(initial?.href   ?? 'https://');
  const [target, setTarget] = useState(initial?.target ?? '_blank');
  const [title,  setTitle]  = useState(initial?.title  ?? '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-sm rounded-2xl p-6 space-y-4 border border-[rgba(139,92,246,0.3)]">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">แทรกลิงก์</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><BsX size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/60 mb-1 block">URL *</label>
            <input value={href} onChange={e => setHref(e.target.value)} autoFocus
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">Title (tooltip)</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="คำอธิบายลิงก์"
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">เปิดใน</label>
            <select value={target} onChange={e => setTarget(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] rounded-xl px-3 py-2 text-sm text-white outline-none">
              <option value="_blank">แท็บใหม่ (_blank)</option>
              <option value="_self">แท็บเดิม (_self)</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-white/60 border border-[rgba(255,255,255,0.1)] hover:text-white transition-colors">ยกเลิก</button>
          <button onClick={() => href && onConfirm(href, target, title)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[rgba(139,92,246,0.8)] hover:bg-[rgba(139,92,246,1)] text-white transition-colors flex items-center justify-center gap-1.5">
            <BsCheck size={16} /> แทรก
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Image modal ----
interface MediaItem { name: string; url: string; size: number; mtime: string }

function ImageModal({ onConfirm, onClose }: {
  onConfirm: (src: string, alt: string, width: string, align: string) => void;
  onClose: () => void;
}) {
  const [tab,    setTab]    = useState<'upload'|'library'>('library');
  const [src,    setSrc]    = useState('');
  const [alt,    setAlt]    = useState('');
  const [width,  setWidth]  = useState('100%');
  const [align,  setAlign]  = useState('none');
  const [uploading, setUploading] = useState(false);
  const [media,  setMedia]  = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [picked, setPicked] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab !== 'library') return;
    setLoadingMedia(true);
    fetch('/api/admin/media').then(r => r.json()).then(d => { setMedia(d); setLoadingMedia(false); });
  }, [tab]);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (d.url) { setSrc(d.url); setTab('upload'); }
    } finally { setUploading(false); }
  }

  function pickFromLibrary(url: string) {
    setPicked(url);
    setSrc(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-lg rounded-2xl p-6 space-y-4 border border-[rgba(139,92,246,0.3)]">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">แทรกรูปภาพ</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><BsX size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[rgba(255,255,255,0.04)] p-1 rounded-xl">
          {(['library','upload'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={['flex-1 py-1.5 rounded-lg text-sm font-medium transition-all', tab === t ? 'bg-[rgba(139,92,246,0.3)] text-white' : 'text-white/50 hover:text-white'].join(' ')}>
              {t === 'library' ? '🖼 คลังภาพ' : '⬆ อัปโหลด/URL'}
            </button>
          ))}
        </div>

        {/* Library tab */}
        {tab === 'library' && (
          <div className="space-y-3">
            {loadingMedia ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({length:8}).map((_,i) => <div key={i} className="aspect-square glass rounded-lg animate-pulse" />)}
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-white/40 py-6 text-sm">ยังไม่มีภาพในคลัง — อัปโหลดก่อน</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {media.map(m => (
                  <button key={m.name} onClick={() => pickFromLibrary(m.url)} type="button"
                    className={['relative aspect-square rounded-lg overflow-hidden border-2 transition-all', picked === m.url ? 'border-[#a78bfa]' : 'border-transparent hover:border-[rgba(139,92,246,0.5)]'].join(' ')}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                    {picked === m.url && <div className="absolute inset-0 bg-[rgba(139,92,246,0.3)] flex items-center justify-center"><BsCheck size={20} className="text-white" /></div>}
                  </button>
                ))}
              </div>
            )}
            {picked && <p className="text-xs text-[#a78bfa] truncate">เลือก: {picked}</p>}
          </div>
        )}

        {/* Upload/URL tab */}
        {tab === 'upload' && (
          <div className="space-y-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full py-2.5 rounded-xl text-sm border border-dashed border-[rgba(139,92,246,0.4)] text-white/60 hover:text-white hover:border-[rgba(139,92,246,0.8)] transition-all flex items-center justify-center gap-2">
              <BsUpload size={14} />{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดจากเครื่อง'}
            </button>
            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
              <span className="text-xs text-white/30">หรือวาง URL</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.1)]" />
            </div>
            <input value={src} onChange={e => setSrc(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2 text-sm text-white outline-none" />
            {src && <img src={src} alt="" className="w-full max-h-28 object-contain rounded-lg bg-[rgba(255,255,255,0.04)]" />}
          </div>
        )}

        {/* Common: alt + size + align */}
        {(src || picked) && (
          <div className="space-y-2 border-t border-[rgba(139,92,246,0.1)] pt-3">
            <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Alt text (SEO) *"
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2 text-sm text-white outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input value={width} onChange={e => setWidth(e.target.value)} placeholder="100% หรือ 600px"
                className="bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] rounded-xl px-3 py-2 text-sm text-white outline-none" />
              <select value={align} onChange={e => setAlign(e.target.value)}
                className="bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] rounded-xl px-3 py-2 text-sm text-white outline-none">
                <option value="none">ปกติ</option><option value="left">ซ้าย</option>
                <option value="center">กลาง</option><option value="right">ขวา</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-white/60 border border-[rgba(255,255,255,0.1)] hover:text-white transition-colors">ยกเลิก</button>
          <button onClick={() => { const url = src || picked; url && onConfirm(url, alt, width, align); }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[rgba(139,92,246,0.8)] hover:bg-[rgba(139,92,246,1)] text-white transition-colors flex items-center justify-center gap-1.5">
            <BsCheck size={16} /> แทรก
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- YouTube modal ----
function YoutubeModal({ onConfirm, onClose }: {
  onConfirm: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-sm rounded-2xl p-6 space-y-4 border border-[rgba(139,92,246,0.3)]">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">แทรก YouTube</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><BsX size={20} /></button>
        </div>
        <input value={url} onChange={e => setUrl(e.target.value)} autoFocus
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)] rounded-xl px-3 py-2 text-sm text-white outline-none" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-white/60 border border-[rgba(255,255,255,0.1)] hover:text-white transition-colors">ยกเลิก</button>
          <button onClick={() => url && onConfirm(url)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1.5">
            <BsYoutube size={16} /> แทรก
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Toolbar button ----
function Btn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick(); }} title={title}
      className={[
        'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all shrink-0',
        active
          ? 'bg-[rgba(139,92,246,0.3)] text-[#c4b5fd]'
          : 'text-white hover:bg-[rgba(139,92,246,0.15)] hover:text-[#c4b5fd]',
      ].join(' ')}>
      {children}
    </button>
  );
}

function Sep() { return <div className="w-px h-5 bg-[rgba(255,255,255,0.1)] mx-0.5" />; }

// ---- Main component ----
export default function RichEditor({ value, onChange, placeholder }: Props) {
  const [linkModal,  setLinkModal]  = useState(false);
  const [imgModal,   setImgModal]   = useState(false);
  const [ytModal,    setYtModal]    = useState(false);
  const [htmlMode,   setHtmlMode]   = useState(false);
  const [rawHtml,    setRawHtml]    = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  function switchToHtml() {
    if (!editor) return;
    setRawHtml(editor.getHTML());
    setHtmlMode(true);
  }

  function switchToVisual() {
    if (!editor) return;
    editor.commands.setContent(rawHtml);
    onChange(rawHtml);
    setHtmlMode(false);
  }

  function onRawChange(v: string) {
    setRawHtml(v);
    onChange(v);
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit v3 already bundles Link & Underline — disable to avoid duplicate conflict
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      EditableImage.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder ?? 'เริ่มเขียนบทความที่นี่...' }),
      Color,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      CharacterCount,
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      Typography,
    ],
    content: value,
    onUpdate({ editor }) { onChange(editor.getHTML()); },
    editorProps: {
      attributes: {
        class: 'rich-editor focus:outline-none min-h-[450px] px-5 py-4 text-[#F1F5F9] text-base leading-relaxed',
      },
    },
  }, []);

  const insertLink = useCallback((href: string, target: string, title: string) => {
    if (!editor) return;
    editor.chain().focus().setLink({ href, target, title: title || undefined }).run();
    setLinkModal(false);
  }, [editor]);

  const insertImage = useCallback((src: string, alt: string, width: string, align: string) => {
    if (!editor) return;
    const style = [
      width ? `width:${width}` : '',
      align === 'center' ? 'display:block;margin:0 auto' : '',
      align === 'left'   ? 'float:left;margin-right:1em' : '',
      align === 'right'  ? 'float:right;margin-left:1em' : '',
    ].filter(Boolean).join(';');
    editor.chain().focus().setImage({ src, alt, ...(style ? { style } : {}) }).run();
    setImgModal(false);
  }, [editor]);

  const insertYoutube = useCallback((url: string) => {
    editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    setYtModal(false);
  }, [editor]);

  const words = editor?.storage.characterCount.words() ?? 0;
  const chars = editor?.storage.characterCount.characters() ?? 0;

  // ---- Context menu ----
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  function openCtxMenu(e: React.MouseEvent) {
    if (htmlMode) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', (e) => e.key === 'Escape' && close());
    return () => window.removeEventListener('mousedown', close);
  }, [ctxMenu]);

  if (!editor) return null;

  const canUndo = editor.can().chain().focus().undo().run();
  const canRedo = editor.can().chain().focus().redo().run();

  return (
    <>
      {linkModal  && <LinkModal  onConfirm={insertLink}   onClose={() => setLinkModal(false)}
        initial={editor.getAttributes('link') as { href: string; target: string; title: string } | undefined} />}
      {imgModal   && <ImageModal onConfirm={insertImage}  onClose={() => setImgModal(false)} />}
      {ytModal    && <YoutubeModal onConfirm={insertYoutube} onClose={() => setYtModal(false)} />}

      <div className="glass overflow-hidden border border-[rgba(139,92,246,0.15)] rounded-2xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-[rgba(139,92,246,0.12)] bg-[rgba(0,0,0,0.2)]">

          {/* Undo / Redo */}
          <Btn onClick={() => editor.chain().focus().undo().run()} active={false} title="Undo">
            <BsArrowCounterclockwise size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} active={false} title="Redo">
            <BsArrowClockwise size={15} />
          </Btn>
          <Sep />

          {/* Heading */}
          {([1,2,3,4,5,6] as const).map(n => (
            <Btn key={n}
              onClick={() => editor.chain().focus().toggleHeading({ level: n }).run()}
              active={editor.isActive('heading', { level: n })}
              title={`Heading ${n}`}>
              <span className="text-[11px] font-bold">H{n}</span>
            </Btn>
          ))}
          <Sep />

          {/* Inline formatting */}
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <BsTypeBold size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <BsTypeItalic size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
            <BsTypeUnderline size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
            <BsTypeStrikethrough size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHighlight({ color: '#a78bfa33' }).run()} active={editor.isActive('highlight')} title="Highlight">
            <BsHighlighter size={14} />
          </Btn>
          <Sep />

          {/* Alignment */}
          <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
            <BsTextLeft size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
            <BsTextCenter size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
            <BsTextRight size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
            <BsJustify size={15} />
          </Btn>
          <Sep />

          {/* Lists */}
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
            <BsListUl size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
            <BsListOl size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
            <BsBlockquoteLeft size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
            <BsCode size={15} />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
            <BsCodeSquare size={15} />
          </Btn>
          <Sep />

          {/* Media */}
          <Btn onClick={() => setLinkModal(true)} active={editor.isActive('link')} title="แทรก/แก้ไขลิงก์">
            <BsLink45Deg size={16} />
          </Btn>
          {editor.isActive('link') && (
            <Btn onClick={() => editor.chain().focus().unsetLink().run()} active={false} title="ลบลิงก์">
              <BsSlashCircle size={13} />
            </Btn>
          )}
          <Btn onClick={() => setImgModal(true)} active={false} title="แทรกรูปภาพ">
            <BsImage size={15} />
          </Btn>
          <Btn onClick={() => setYtModal(true)} active={false} title="แทรก YouTube">
            <BsYoutube size={15} />
          </Btn>
          <Sep />

          {/* Table */}
          <Btn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} active={false} title="แทรกตาราง">
            <BsTable size={14} />
          </Btn>
          {editor.isActive('table') && (
            <>
              <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}
                className="px-2 h-8 text-xs text-white/70 hover:text-white rounded-lg hover:bg-[rgba(139,92,246,0.15)] transition-all">+คอลัมน์</button>
              <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}
                className="px-2 h-8 text-xs text-white/70 hover:text-white rounded-lg hover:bg-[rgba(139,92,246,0.15)] transition-all">+แถว</button>
              <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
                className="px-2 h-8 text-xs text-rose-400 hover:text-rose-300 rounded-lg hover:bg-[rgba(239,68,68,0.1)] transition-all">ลบตาราง</button>
            </>
          )}
          <Sep />

          {/* HR */}
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="เส้นคั่น">
            <span className="text-[11px] font-bold">HR</span>
          </Btn>

          {/* Mode toggle — far right */}
          <div className="ml-auto">
            <button type="button"
              onClick={htmlMode ? switchToVisual : switchToHtml}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                htmlMode
                  ? 'bg-[rgba(139,92,246,0.25)] text-[#a78bfa] border border-[rgba(139,92,246,0.5)]'
                  : 'bg-[rgba(255,255,255,0.06)] text-white border border-[rgba(255,255,255,0.1)] hover:text-[#c4b5fd]',
              ].join(' ')}>
              {htmlMode ? <><BsPencil size={12} /> Visual</> : <><BsCodeSlash size={13} /> HTML</>}
            </button>
          </div>
        </div>

        {/* HTML mode toolbar + textarea */}
        {htmlMode ? (
          <>
            <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-[rgba(139,92,246,0.1)] bg-[rgba(0,0,0,0.15)]">
              {HTML_TAGS.map(t => (
                <button key={t.label} type="button"
                  onMouseDown={e => { e.preventDefault(); taRef.current && insertHtmlTag(taRef.current, t.wrap, onRawChange); }}
                  className="px-2 py-1 text-xs font-mono font-semibold text-white hover:text-[#c4b5fd] bg-[rgba(139,92,246,0.07)] hover:bg-[rgba(139,92,246,0.18)] rounded-lg transition-all">
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              ref={taRef}
              value={rawHtml}
              onChange={e => onRawChange(e.target.value)}
              rows={24}
              spellCheck={false}
              className="w-full bg-transparent px-4 py-3 text-base text-[#F1F5F9] font-mono outline-none resize-y leading-relaxed"
            />
          </>
        ) : (
          /* Visual editor */
          <div className="relative" onContextMenu={openCtxMenu}>
            <EditorContent editor={editor} />

            {/* Context menu */}
            {ctxMenu && (
              <div ref={ctxRef}
                className="absolute z-50 min-w-[200px] glass border border-[rgba(139,92,246,0.3)] rounded-xl py-1.5 shadow-2xl overflow-hidden"
                style={{ top: ctxMenu.y, left: Math.min(ctxMenu.x, 500) }}
                onMouseDown={e => e.stopPropagation()}>

                {/* Formatting */}
                <div className="px-2 pb-1 pt-0.5">
                  <p className="text-[9px] text-[#94A3B8] uppercase tracking-widest px-2 pb-1">จัดรูปแบบ</p>
                  <div className="grid grid-cols-2 gap-0.5">
                    {[
                      { label: 'Bold',        icon: 'B',  action: () => editor.chain().focus().toggleBold().run(),        active: editor.isActive('bold') },
                      { label: 'Italic',      icon: 'I',  action: () => editor.chain().focus().toggleItalic().run(),      active: editor.isActive('italic') },
                      { label: 'Underline',   icon: 'U',  action: () => editor.chain().focus().toggleUnderline().run(),   active: editor.isActive('underline') },
                      { label: 'Strikethrough', icon: 'S', action: () => editor.chain().focus().toggleStrike().run(),    active: editor.isActive('strike') },
                    ].map(item => (
                      <button key={item.label} type="button"
                        onMouseDown={e => { e.preventDefault(); item.action(); setCtxMenu(null); }}
                        className={['flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all',
                          item.active ? 'bg-[rgba(139,92,246,0.25)] text-white' : 'text-[#94A3B8] hover:bg-[rgba(139,92,246,0.12)] hover:text-white'
                        ].join(' ')}>
                        <span className="font-bold w-4 text-center">{item.icon}</span> {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[rgba(139,92,246,0.15)] mx-2 my-1" />

                {/* Headings */}
                <div className="px-2 pb-1">
                  <p className="text-[9px] text-[#94A3B8] uppercase tracking-widest px-2 pb-1">หัวข้อ</p>
                  <div className="grid grid-cols-3 gap-0.5">
                    {([1,2,3] as const).map(level => (
                      <button key={level} type="button"
                        onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level }).run(); setCtxMenu(null); }}
                        className={['px-2 py-1.5 rounded-lg text-xs font-bold transition-all',
                          editor.isActive('heading', { level }) ? 'bg-[rgba(139,92,246,0.25)] text-white' : 'text-[#94A3B8] hover:bg-[rgba(139,92,246,0.12)] hover:text-white'
                        ].join(' ')}>
                        H{level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-[rgba(139,92,246,0.15)] mx-2 my-1" />

                {/* Insert */}
                <div className="px-2 pb-1">
                  <p className="text-[9px] text-[#94A3B8] uppercase tracking-widest px-2 pb-1">แทรก</p>
                  {[
                    { label: 'แทรกลิงก์',  icon: '🔗', action: () => { setLinkModal(true); setCtxMenu(null); } },
                    { label: 'แทรกรูปภาพ', icon: '🖼', action: () => { setImgModal(true);  setCtxMenu(null); } },
                    { label: 'แทรกตาราง',  icon: '⊞', action: () => { editor.chain().focus().insertTable({ rows:3, cols:3, withHeaderRow:true }).run(); setCtxMenu(null); } },
                    { label: 'เส้นคั่น',   icon: '—',  action: () => { editor.chain().focus().setHorizontalRule().run(); setCtxMenu(null); } },
                  ].map(item => (
                    <button key={item.label} type="button"
                      onMouseDown={e => { e.preventDefault(); item.action(); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:bg-[rgba(139,92,246,0.12)] hover:text-white transition-all">
                      <span className="w-4 text-center">{item.icon}</span> {item.label}
                    </button>
                  ))}
                </div>

                <div className="h-px bg-[rgba(139,92,246,0.15)] mx-2 my-1" />

                {/* Native copy/cut/paste */}
                <div className="px-2 pb-1">
                  {[
                    { label: 'Copy',  shortcut: 'Ctrl+C', action: () => { document.execCommand('copy');  setCtxMenu(null); } },
                    { label: 'Cut',   shortcut: 'Ctrl+X', action: () => { document.execCommand('cut');   setCtxMenu(null); } },
                    { label: 'Paste', shortcut: 'Ctrl+V', action: () => { editor.commands.focus(); document.execCommand('paste'); setCtxMenu(null); } },
                  ].map(item => (
                    <button key={item.label} type="button"
                      onMouseDown={e => { e.preventDefault(); item.action(); }}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:bg-[rgba(139,92,246,0.12)] hover:text-white transition-all">
                      <span>{item.label}</span>
                      <span className="text-[#475569] font-mono">{item.shortcut}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[rgba(139,92,246,0.08)] flex justify-between text-xs text-white/50 bg-[rgba(0,0,0,0.15)]">
          {htmlMode
            ? <><span>{rawHtml.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length.toLocaleString()} คำ</span>
                <span>{rawHtml.length.toLocaleString()} ตัวอักษร</span></>
            : <><span>{words.toLocaleString()} คำ</span>
                <span>{chars.toLocaleString()} ตัวอักษร</span></>
          }
        </div>
      </div>

      <style>{`
        .rich-editor { color: #F1F5F9; }
        .rich-editor h1 { font-size: 2rem; font-weight: 800; margin: 1.2em 0 0.5em; color: #fff; line-height: 1.2; }
        .rich-editor h2 { font-size: 1.5rem; font-weight: 700; margin: 1.1em 0 0.4em; color: #fff; }
        .rich-editor h3 { font-size: 1.25rem; font-weight: 700; margin: 1em 0 0.4em; color: #e2e8f0; }
        .rich-editor h4 { font-size: 1.1rem; font-weight: 600; margin: 0.9em 0 0.3em; color: #e2e8f0; }
        .rich-editor h5,
        .rich-editor h6 { font-size: 1rem; font-weight: 600; margin: 0.8em 0 0.3em; color: #cbd5e1; }
        .rich-editor p { margin: 0.7em 0; }
        .rich-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #475569;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .rich-editor strong { color: #fff; }
        .rich-editor em { color: #c4b5fd; }
        .rich-editor u  { text-decoration-color: #a78bfa; }
        .rich-editor s  { color: #94a3b8; }
        .rich-editor a  { color: #a78bfa; text-decoration: underline; }
        .rich-editor a:hover { color: #c4b5fd; }
        .rich-editor ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        .rich-editor li { margin: 0.2em 0; }
        .rich-editor blockquote {
          border-left: 3px solid rgba(139,92,246,0.6);
          padding-left: 1em;
          margin: 1em 0;
          color: #cbd5e1;
          font-style: italic;
        }
        .rich-editor code {
          background: rgba(139,92,246,0.15);
          color: #a78bfa;
          padding: 0.1em 0.4em;
          border-radius: 4px;
          font-family: 'Fira Mono', monospace;
          font-size: 0.9em;
        }
        .rich-editor pre {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(139,92,246,0.2);
          border-radius: 10px;
          padding: 1em;
          overflow-x: auto;
          margin: 1em 0;
        }
        .rich-editor pre code {
          background: none;
          color: #a78bfa;
          padding: 0;
        }
        .rich-editor hr { border: none; border-top: 1px solid rgba(139,92,246,0.3); margin: 1.5em 0; }
        .rich-editor img { max-width: 100%; height: auto; border-radius: 10px; margin: 0.5em 0; }
        .rich-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
          border-radius: 8px;
          overflow: hidden;
        }
        .rich-editor th {
          background: rgba(139,92,246,0.2);
          color: #c4b5fd;
          font-weight: 600;
          padding: 0.6em 0.8em;
          border: 1px solid rgba(139,92,246,0.25);
          text-align: left;
        }
        .rich-editor td {
          padding: 0.6em 0.8em;
          border: 1px solid rgba(255,255,255,0.08);
          color: #cbd5e1;
        }
        .rich-editor tr:hover td { background: rgba(139,92,246,0.05); }
        .rich-editor .selectedCell:after {
          background: rgba(139,92,246,0.2);
          content: '';
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .rich-editor .column-resize-handle {
          background-color: #a78bfa;
          bottom: -2px; position: absolute;
          right: -2px; top: 0; width: 4px;
          pointer-events: none;
        }
        .rich-editor .tableWrapper { overflow-x: auto; }
        iframe.ProseMirror-selectednode { outline: 3px solid #a78bfa; }
      `}</style>
    </>
  );
}
