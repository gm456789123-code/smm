'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BsCheckCircle, BsExclamationTriangle, BsChatSquareDots,
  BsClockHistory, BsArrowClockwise, BsChatLeftText,
  BsPaperclip, BsX, BsImage,
} from 'react-icons/bs';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const CATEGORIES = [
  'ออเดอร์ไม่ทำงาน / ค้าง',
  'ถูกหักเงินแต่ไม่ได้รับบริการ',
  'เติมเงินแล้วยอดไม่เข้า',
  'บริการผิดพลาด / จำนวนไม่ครบ',
  'ปัญหาเข้าสู่ระบบ',
  'อื่นๆ',
];

interface Ticket {
  id: number;
  category: string;
  order_ref: string | null;
  detail: string;
  attachment_url: string | null;
  ticket_status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  open:        { label: 'เปิด',           cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  in_progress: { label: 'กำลังดำเนินการ', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  closed:      { label: 'ปิดแล้ว',        cls: 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa] border-[rgba(139,92,246,0.25)]' },
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function ReportPage() {
  const [tab, setTab] = useState<'new' | 'history'>('new');

  const [category, setCategory] = useState('');
  const [orderId,  setOrderId]  = useState('');
  const [detail,   setDetail]   = useState('');
  const [file,     setFile]     = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending,  setSending]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = useCallback(() => {
    setLoading(true);
    fetch('/api/report')
      .then(r => r.json())
      .then(d => { setTickets(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (tab === 'history') loadTickets(); }, [tab, loadTickets]);

  function pickFile(f: File | null) {
    setError('');
    if (!f) { setFile(null); setFilePreview(null); return; }
    if (!ALLOWED_ATTACHMENT_TYPES.includes(f.type)) {
      setError('ไฟล์แนบต้องเป็นรูปภาพ (jpg, png, gif, webp)');
      return;
    }
    if (f.size > MAX_ATTACHMENT_SIZE) {
      setError('ไฟล์แนบต้องไม่เกิน 5 MB');
      return;
    }
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  }

  function clearFile() {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function resetForm() {
    setDone(false); setCategory(''); setOrderId(''); setDetail(''); clearFile();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !detail.trim()) return;
    setSending(true);
    setError('');
    try {
      const body = new FormData();
      body.set('category', category);
      body.set('orderId', orderId.trim());
      body.set('detail', detail.trim());
      if (file) body.set('file', file);

      const res = await fetch('/api/report', { method: 'POST', body });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      } else {
        setDone(true);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex-1 p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
          <BsChatSquareDots size={20} className="text-[#a78bfa]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">แจ้งปัญหา</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">กรอกรายละเอียดเพื่อให้ทีมงานช่วยเหลือ</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('new')}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            tab === 'new'
              ? 'border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.15)] text-[#c4b5fd]'
              : 'border-[rgba(255,255,255,0.07)] text-[#94A3B8] hover:text-white'
          }`}
        >
          แจ้งปัญหาใหม่
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
            tab === 'history'
              ? 'border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.15)] text-[#c4b5fd]'
              : 'border-[rgba(255,255,255,0.07)] text-[#94A3B8] hover:text-white'
          }`}
        >
          ประวัติ Ticket ของฉัน
        </button>
      </div>

      {tab === 'new' && (
        done ? (
          <div className="glass border-t-2 border-t-emerald-400/60 p-10 max-w-md w-full text-center space-y-4 mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
              <BsCheckCircle size={28} className="text-emerald-400" />
            </div>
            <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">ส่งคำร้องแล้ว</h2>
            <p className="text-[#94A3B8] text-sm">ทีมงานจะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={resetForm}
                className="glass-tab glass-tab-active px-6 py-2.5 text-sm font-semibold text-[#c4b5fd]"
              >
                แจ้งปัญหาใหม่
              </button>
              <button
                onClick={() => { resetForm(); setTab('history'); }}
                className="glass-tab px-6 py-2.5 text-sm font-semibold text-[#94A3B8] hover:text-white"
              >
                ดูประวัติ Ticket
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="glass border-t-2 border-t-[#8B5CF6]/60 p-6 space-y-5">

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ประเภทปัญหา</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setCategory(c)}
                    className={[
                      'text-left px-4 py-3 rounded-xl text-sm border transition-all',
                      category === c
                        ? 'bg-[rgba(139,92,246,0.15)] border-[rgba(139,92,246,0.50)] text-[#c4b5fd]'
                        : 'glass-tab text-[#94A3B8] hover:text-white',
                    ].join(' ')}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Order ID */}
            <div className="space-y-2">
              <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">
                Order ID <span className="normal-case font-normal text-[#94A3B8]">(ถ้ามี)</span>
              </label>
              <input
                type="text" value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="เช่น 10234"
                className="w-full glass px-4 py-3 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(255,255,255,0.10)] focus:border-[rgba(139,92,246,0.50)] transition-colors"
              />
            </div>

            {/* Detail */}
            <div className="space-y-2">
              <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">รายละเอียด</label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="อธิบายปัญหาที่พบ เช่น ออเดอร์ #12345 สั่งไปแล้ว 3 ชั่วโมงยังไม่เริ่ม..."
                rows={5}
                className="w-full glass px-4 py-3 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#334155] rounded-xl border border-[rgba(255,255,255,0.10)] focus:border-[rgba(139,92,246,0.50)] transition-colors resize-none"
                required
              />
              <p className={`text-[11px] text-right ${detail.length > 800 ? 'text-rose-400' : 'text-[#64748B]'}`}>
                {detail.length} / 800
              </p>
            </div>

            {/* Attachment */}
            <div className="space-y-2">
              <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">
                แนบไฟล์ <span className="normal-case font-normal text-[#94A3B8]">(ถ้ามี — เช่น สลิป, สกรีนช็อต)</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={e => pickFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {filePreview ? (
                <div className="relative w-fit">
                  <img src={filePreview} alt="ไฟล์แนบ" className="max-h-40 rounded-xl border border-[rgba(255,255,255,0.10)]" />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500/90 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                    aria-label="ลบไฟล์แนบ"
                  >
                    <BsX size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-tab flex items-center gap-2 px-4 py-3 text-sm text-[#94A3B8] hover:text-white w-full sm:w-auto"
                >
                  <BsPaperclip size={14} />
                  เลือกไฟล์ภาพ
                </button>
              )}
              {file && (
                <p className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                  <BsImage size={11} /> {file.name} · {(file.size / 1024).toFixed(0)} KB
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm">
                <BsExclamationTriangle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!category || !detail.trim() || sending || detail.length > 800}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              {sending
                ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> กำลังส่ง...</>
                : 'ส่งคำร้อง'}
            </button>
          </form>
        )
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={loadTickets}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-[#94A3B8] hover:text-white border border-[rgba(255,255,255,0.07)] hover:border-[rgba(139,92,246,0.3)] transition-all">
              <BsArrowClockwise size={12} />
              รีเฟรช
            </button>
          </div>

          <div className="glass overflow-hidden">
            {loading ? (
              <p className="py-12 text-center text-[#94A3B8] animate-pulse">กำลังโหลด...</p>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <BsClockHistory size={24} className="text-[#475569] mx-auto" />
                <p className="text-[#94A3B8] text-sm">คุณยังไม่เคยแจ้งปัญหา</p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(139,92,246,0.06)]">
                {tickets.map(t => {
                  const st = STATUS[t.ticket_status] ?? STATUS['open'];
                  return (
                    <div key={t.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[#94A3B8]">#{t.id}</span>
                          <span className="text-sm font-medium text-white">{t.category}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                          {t.order_ref && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(6,182,212,0.1)] text-cyan-400 border border-cyan-500/20">
                              Order: {t.order_ref}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#64748B] shrink-0">{fmtDate(t.created_at)}</span>
                      </div>

                      <p className="text-sm text-[#CBD5E1] whitespace-pre-wrap">{t.detail}</p>

                      {t.attachment_url && (
                        <a href={t.attachment_url} target="_blank" rel="noopener noreferrer" className="block w-fit">
                          <img
                            src={t.attachment_url}
                            alt="ไฟล์แนบ"
                            className="max-h-32 rounded-xl border border-[rgba(255,255,255,0.10)] hover:opacity-80 transition-opacity"
                          />
                        </a>
                      )}

                      {t.admin_note ? (
                        <div className="flex items-start gap-2.5 mt-2 p-3 rounded-xl bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.18)]">
                          <BsChatLeftText size={14} className="text-[#a78bfa] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-[#a78bfa] uppercase tracking-widest font-semibold mb-1">ทีมงานตอบกลับ</p>
                            <p className="text-sm text-[#E9D5FF] whitespace-pre-wrap">{t.admin_note}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748B] italic">ยังไม่มีการตอบกลับ</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
