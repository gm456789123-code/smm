'use client';

import { useEffect, useState, useCallback } from 'react';
import { BsArrowClockwise, BsCheckCircle, BsChatSquareText, BsXCircle } from 'react-icons/bs';

interface Ticket {
  id: number;
  user_id: number;
  username: string;
  category: string;
  order_ref: string | null;
  detail: string;
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

export default function AdminTicketsPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState<{ status: string; note: string }>({ status: '', note: '' });
  const [filter, setFilter]     = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/tickets')
      .then(r => r.json())
      .then(d => { setTickets(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openTicket(t: Ticket) {
    setExpanded(expanded === t.id ? null : t.id);
    setForm({ status: t.ticket_status, note: t.admin_note ?? '' });
  }

  async function save(id: number) {
    setSaving(true);
    await fetch('/api/admin/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ticket_status: form.status, admin_note: form.note }),
    });
    setSaving(false);
    load();
    setExpanded(null);
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.ticket_status === filter);
  const openCount = tickets.filter(t => t.ticket_status === 'open').length;

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">Support Tickets</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">
            {tickets.length} รายการ
            {openCount > 0 && <span className="ml-2 text-amber-400 font-semibold">· {openCount} รอตอบ</span>}
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-[rgba(251,191,36,0.2)] hover:border-[rgba(251,191,36,0.45)] hover:bg-[rgba(251,191,36,0.06)] transition-all">
          <BsArrowClockwise size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'in_progress', 'closed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filter === s
                ? 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.12)] text-yellow-300'
                : 'border-[rgba(255,255,255,0.07)] text-[#94A3B8] hover:text-white'
            }`}>
            {s === 'all' ? 'ทั้งหมด' : STATUS[s]?.label ?? s}
            {s === 'open' && openCount > 0 && (
              <span className="ml-1.5 bg-amber-400 text-black text-[9px] font-bold px-1.5 rounded-full">{openCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      <div className="glass overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-[#94A3B8] animate-pulse">กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-[#94A3B8]">ไม่มี Ticket</p>
        ) : (
          <div className="divide-y divide-[rgba(139,92,246,0.06)]">
            {filtered.map(t => {
              const st = STATUS[t.ticket_status] ?? STATUS['open'];
              const isOpen = expanded === t.id;
              return (
                <div key={t.id}>
                  <button
                    onClick={() => openTicket(t)}
                    className="w-full p-4 text-left hover:bg-[rgba(139,92,246,0.04)] transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-wrap">
                      <BsChatSquareText size={16} className="text-[#8B5CF6] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-sm">{t.username}</span>
                          <span className="text-xs text-[#94A3B8]">#{t.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                          {t.order_ref && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(6,182,212,0.1)] text-cyan-400 border border-cyan-500/20">
                              Order: {t.order_ref}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-1 font-medium">{t.category}</p>
                        <p className="text-sm text-[#CBD5E1] mt-1 line-clamp-2">{t.detail}</p>
                        {t.admin_note && (
                          <p className="text-xs text-[#8B5CF6] mt-1 italic">ตอบแล้ว: {t.admin_note}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-[#94A3B8]">
                          {new Date(t.created_at).toLocaleDateString('th-TH', {
                            day: '2-digit', month: 'short', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">{isOpen ? '▲ ปิด' : '▼ ตอบ'}</p>
                      </div>
                    </div>
                  </button>

                  {/* Inline response form */}
                  {isOpen && (
                    <div className="px-4 pb-4 bg-[rgba(139,92,246,0.03)] border-t border-[rgba(139,92,246,0.08)]">
                      <div className="space-y-3 pt-3">
                        <div>
                          <label className="text-[10px] text-[#94A3B8] uppercase tracking-widest block mb-1.5">รายละเอียดเต็ม</label>
                          <p className="text-sm text-[#CBD5E1] whitespace-pre-wrap glass p-3 rounded-xl">{t.detail}</p>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#94A3B8] uppercase tracking-widest block mb-1.5">สถานะ</label>
                          <select
                            value={form.status}
                            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                            className="glass px-3 py-2 rounded-xl text-sm text-white border border-[rgba(139,92,246,0.2)] bg-transparent focus:border-[rgba(139,92,246,0.5)] outline-none"
                          >
                            <option value="open" className="bg-[#0D1220]">เปิด</option>
                            <option value="in_progress" className="bg-[#0D1220]">กำลังดำเนินการ</option>
                            <option value="closed" className="bg-[#0D1220]">ปิดแล้ว</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#94A3B8] uppercase tracking-widest block mb-1.5">หมายเหตุ Admin</label>
                          <textarea
                            value={form.note}
                            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            rows={3}
                            placeholder="ตอบกลับหรือบันทึกสถานะ..."
                            className="w-full glass px-3 py-2 rounded-xl text-sm text-white border border-[rgba(139,92,246,0.2)] bg-transparent focus:border-[rgba(139,92,246,0.5)] outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => save(t.id)}
                            disabled={saving}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[rgba(251,191,36,0.15)] text-yellow-300 border border-[rgba(251,191,36,0.3)] hover:bg-[rgba(251,191,36,0.25)] transition-all disabled:opacity-50"
                          >
                            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                          </button>
                          <button
                            onClick={() => setExpanded(null)}
                            className="px-4 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-[rgba(255,255,255,0.07)] transition-all"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
