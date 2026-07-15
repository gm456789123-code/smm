'use client';

import { useEffect, useState, useCallback } from 'react';
import { BsArrowClockwise, BsCheckCircle, BsClockHistory, BsXCircle } from 'react-icons/bs';

interface Topup {
  id: number;
  user_id: number;
  username: string;
  amount: number;
  ref: string | null;
  tx_status: string;
  note: string | null;
  created_at: string;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: 'สำเร็จ',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  pending:   { label: 'รอดำเนินการ', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  failed:    { label: 'ล้มเหลว',     cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function AdminTopupsPage() {
  const [rows, setRows]       = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/topups')
      .then(r => r.json())
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? rows : rows.filter(r => r.tx_status === filter);

  const totalCompleted = rows.filter(r => r.tx_status === 'completed').reduce((s, r) => s + Number(r.amount), 0);
  const pendingCount   = rows.filter(r => r.tx_status === 'pending').length;

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">ประวัติเติมเงิน</h1>
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
          <p className="text-[10px] text-[#475569] uppercase tracking-widest">รายได้รวม (สำเร็จ)</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">฿{totalCompleted.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="glass p-4">
          <p className="text-[10px] text-[#475569] uppercase tracking-widest">รอดำเนินการ</p>
          <p className="text-xl font-bold text-amber-400 mt-1">{pendingCount} รายการ</p>
        </div>
        <div className="glass p-4">
          <p className="text-[10px] text-[#475569] uppercase tracking-widest">ทั้งหมด</p>
          <p className="text-xl font-bold text-[#8B5CF6] mt-1">{rows.length} รายการ</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'completed', 'pending', 'failed'] as const).map(s => (
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
                <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
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
                      <td className="py-3 px-4 text-[#475569] font-mono text-xs">{row.id}</td>
                      <td className="py-3 pr-4 font-semibold text-[#F1F5F9]">{row.username}</td>
                      <td className="py-3 pr-4 font-mono font-bold text-emerald-400">฿{Number(row.amount).toFixed(2)}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-[#94A3B8]">{row.ref ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.cls}`}>
                          {row.tx_status === 'completed' && <BsCheckCircle className="inline mr-1" size={10} />}
                          {row.tx_status === 'pending' && <BsClockHistory className="inline mr-1" size={10} />}
                          {row.tx_status === 'failed' && <BsXCircle className="inline mr-1" size={10} />}
                          {st.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#64748B] max-w-[260px] truncate" title={row.note ?? ''}>
                        {row.note ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#64748B] whitespace-nowrap">
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
  );
}
