'use client';

import { useEffect, useState, useCallback } from 'react';
import { BsArrowClockwise, BsCheckCircle, BsClockHistory, BsXCircle } from 'react-icons/bs';

interface Topup {
  id: number;
  user_id: number;
  username: string;
  email: string;
  amount: number;
  ref: string | null;
  tx_status: string;
  note: string | null;
  provider: string | null;
  proof_url: string | null;
  created_at: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: 'สำเร็จ',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending:   { label: 'รอดำเนินการ', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  cancelled: { label: 'ปฏิเสธ',      cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  failed:    { label: 'ล้มเหลว',     cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function AdminTopupsPage() {
  const [rows, setRows]       = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'completed' | 'cancelled' | 'failed'>('all');
  const [approveAmounts, setApproveAmounts] = useState<Record<number, string>>({});
  const [busy, setBusy]       = useState<Record<number, boolean>>({});
  const [msgs, setMsgs]       = useState<Record<number, { ok: boolean; text: string }>>({});
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/topups')
      .then(r => r.json())
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function action(id: number, act: 'approve' | 'reject') {
    setBusy(b => ({ ...b, [id]: true }));
    setMsgs(m => ({ ...m, [id]: { ok: false, text: '' } }));
    const body: Record<string, unknown> = { action: act };
    if (act === 'approve') body.amount = Number(approveAmounts[id] ?? 0);

    const res  = await fetch(`/api/admin/topups/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsgs(m => ({ ...m, [id]: { ok: false, text: data.error ?? 'เกิดข้อผิดพลาด' } }));
    } else {
      setMsgs(m => ({ ...m, [id]: { ok: true, text: act === 'approve' ? `อนุมัติ ฿${data.amount} สำเร็จ` : 'ปฏิเสธแล้ว' } }));
      load();
    }
    setBusy(b => ({ ...b, [id]: false }));
  }

  const pendingSlips = rows.filter(r => r.tx_status === 'pending' && r.provider === 'slip');
  const history       = rows.filter(r => !(r.tx_status === 'pending' && r.provider === 'slip'));
  const filtered       = filter === 'all' ? history : history.filter(r => r.tx_status === filter);

  const totalCompleted = rows.filter(r => r.tx_status === 'completed').reduce((s, r) => s + Number(r.amount), 0);

  return (
    <>
    {zoomUrl && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-zoom-out"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={() => setZoomUrl(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={zoomUrl} alt="สลิป" className="max-w-full max-h-full rounded-xl object-contain" />
      </div>
    )}
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">เติมเงิน</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">{rows.length} รายการ</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-[rgba(251,191,36,0.2)] hover:border-[rgba(251,191,36,0.45)] hover:bg-[rgba(251,191,36,0.06)] transition-all">
          <BsArrowClockwise size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass p-4">
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">รายได้รวม (สำเร็จ)</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">฿{totalCompleted.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="glass p-4">
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">สลิปรอตรวจสอบ</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{pendingSlips.length} รายการ</p>
        </div>
        <div className="glass p-4">
          <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">ทั้งหมด</p>
          <p className="text-xl font-bold text-[#8B5CF6] mt-1">{rows.length} รายการ</p>
        </div>
      </div>

      {/* Pending slip review queue */}
      {pendingSlips.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <BsClockHistory size={14} /> สลิปรอตรวจสอบ ({pendingSlips.length})
          </h2>
          {pendingSlips.map(tx => (
            <div key={tx.id} className="glass p-5 space-y-4 border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-white font-semibold">{tx.username}</p>
                  <p className="text-[#94A3B8] text-xs">{tx.email}</p>
                  <p className="text-xs text-[#94A3B8]">{new Date(tx.created_at).toLocaleString('th-TH')}</p>
                  {tx.note && <p className="text-xs text-[#CBD5E1] max-w-md">{tx.note}</p>}
                </div>
                {tx.proof_url && (
                  <button
                    type="button"
                    onClick={() => setZoomUrl(tx.proof_url)}
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tx.proof_url}
                      alt="สลิป"
                      className="w-24 h-24 object-cover rounded-xl border border-amber-500/30 hover:border-amber-400 transition-colors cursor-zoom-in"
                    />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap border-t border-amber-500/10 pt-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#94A3B8]">ยอดที่ยืนยัน (฿)</label>
                  <input
                    type="number"
                    min={1}
                    value={approveAmounts[tx.id] ?? String(tx.amount || '')}
                    onChange={e => setApproveAmounts(a => ({ ...a, [tx.id]: e.target.value }))}
                    placeholder="เช่น 100"
                    className="glass w-28 px-3 py-2 text-sm text-[#F1F5F9] bg-transparent outline-none rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                  />
                </div>
                <button
                  onClick={() => action(tx.id, 'approve')}
                  disabled={busy[tx.id] || !(Number(approveAmounts[tx.id] ?? tx.amount) > 0)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/25 transition-colors disabled:opacity-40"
                >
                  {busy[tx.id] ? <span className="animate-spin w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full" /> : <BsCheckCircle size={14} />}
                  อนุมัติ
                </button>
                <button
                  onClick={() => action(tx.id, 'reject')}
                  disabled={busy[tx.id]}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500/12 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors disabled:opacity-40"
                >
                  <BsXCircle size={14} /> ปฏิเสธ
                </button>
                {msgs[tx.id]?.text && (
                  <p className={`text-xs ${msgs[tx.id].ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {msgs[tx.id].text}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'completed', 'cancelled', 'failed'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              filter === s
                ? 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.12)] text-yellow-300'
                : 'border-[rgba(255,255,255,0.07)] text-[#94A3B8] hover:text-white'
            }`}>
            {s === 'all' ? 'ทั้งหมด' : STATUS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-[#94A3B8] animate-pulse">กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-[#94A3B8]">ไม่มีรายการ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-[#94A3B8] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                  <th className="pb-3 px-4">ID</th>
                  <th className="pb-3 pr-4">ผู้ใช้</th>
                  <th className="pb-3 pr-4">จำนวน</th>
                  <th className="pb-3 pr-4">Ref</th>
                  <th className="pb-3 pr-4">สถานะ</th>
                  <th className="pb-3 pr-4">รายละเอียด</th>
                  <th className="pb-3 pr-4">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
                {filtered.map(row => {
                  const st = STATUS[row.tx_status] ?? STATUS['pending'];
                  return (
                    <tr key={row.id} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                      <td className="py-3 px-4 text-[#94A3B8] font-mono text-xs">{row.id}</td>
                      <td className="py-3 pr-4 font-semibold text-[#F1F5F9]">{row.username}</td>
                      <td className="py-3 pr-4 font-mono font-bold text-emerald-400">฿{Number(row.amount).toFixed(2)}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-[#94A3B8]">{row.ref ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>
                          {row.tx_status === 'completed' && <BsCheckCircle className="inline mr-1" size={10} />}
                          {row.tx_status === 'pending' && <BsClockHistory className="inline mr-1" size={10} />}
                          {(row.tx_status === 'failed' || row.tx_status === 'cancelled') && <BsXCircle className="inline mr-1" size={10} />}
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#94A3B8] max-w-[260px] truncate" title={row.note ?? ''}>
                        {row.note ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#94A3B8] whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString('th-TH', {
                          day: '2-digit', month: 'short', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
