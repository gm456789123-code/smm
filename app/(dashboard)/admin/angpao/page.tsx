'use client';

import { useEffect, useState } from 'react';
import { BsCheckCircle, BsXCircle, BsClockHistory } from 'react-icons/bs';

interface AngpaoTx {
  id: number;
  user_id: number;
  username: string;
  email: string;
  amount: number;
  ref: string;
  tx_status: string;
  note: string;
  created_at: string;
}

function extractCode(ref: string) {
  return ref.replace(/^angpao:/, '');
}

export default function AdminAngpaoPage() {
  const [list, setList]       = useState<AngpaoTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveAmounts, setApproveAmounts] = useState<Record<number, string>>({});
  const [busy, setBusy]       = useState<Record<number, boolean>>({});
  const [msgs, setMsgs]       = useState<Record<number, { ok: boolean; text: string }>>({});

  async function load() {
    setLoading(true);
    const data = await fetch('/api/admin/angpao').then(r => r.json()).catch(() => []);
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function action(id: number, act: 'approve' | 'reject') {
    setBusy(b => ({ ...b, [id]: true }));
    setMsgs(m => ({ ...m, [id]: { ok: false, text: '' } }));
    const body: Record<string, unknown> = { action: act };
    if (act === 'approve') body.amount = Number(approveAmounts[id] ?? 0);

    const res  = await fetch(`/api/admin/angpao/${id}`, {
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

  const pending   = list.filter(t => t.tx_status === 'pending');
  const processed = list.filter(t => t.tx_status !== 'pending');

  return (
    <main className="flex-1 p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">ซองอั้งเปา</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">รหัสซองที่รอตรวจสอบจากผู้ใช้</p>
        </div>
        <button onClick={load} className="glass-tab px-4 py-2 text-sm text-[#94A3B8] hover:text-white">
          รีเฟรช
        </button>
      </div>

      {loading ? (
        <div className="glass p-8 text-center text-[#94A3B8] text-sm animate-pulse">กำลังโหลด...</div>
      ) : pending.length === 0 && processed.length === 0 ? (
        <div className="glass p-8 text-center text-[#94A3B8] text-sm">ยังไม่มีซองอั้งเปา</div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <BsClockHistory size={14} /> รอตรวจสอบ ({pending.length})
              </h2>
              {pending.map(tx => {
                const code = extractCode(tx.ref);
                return (
                  <div key={tx.id} className="glass p-5 space-y-4 border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <p className="text-white font-semibold">{tx.username}</p>
                        <p className="text-[#94A3B8] text-xs">{tx.email}</p>
                        <p className="text-xs text-[#94A3B8]">{new Date(tx.created_at).toLocaleString('th-TH')}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-xs text-[#94A3B8] uppercase tracking-wider">รหัสซอง</p>
                        <p className="font-mono text-sm text-amber-400 break-all">{code}</p>
                        <a
                          href={`https://gift.truemoney.com/campaign/?v=${code}`}
                          target="_blank" rel="noreferrer"
                          className="text-xs text-[#8B5CF6] hover:underline inline-block mt-1"
                        >
                          เปิดลิงก์ซอง ↗
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap border-t border-amber-500/10 pt-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#94A3B8]">มูลค่า (฿)</label>
                        <input
                          type="number"
                          min={1} max={5000}
                          value={approveAmounts[tx.id] ?? ''}
                          onChange={e => setApproveAmounts(a => ({ ...a, [tx.id]: e.target.value }))}
                          placeholder="เช่น 100"
                          className="glass w-28 px-3 py-2 text-sm text-[#F1F5F9] bg-transparent outline-none rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                        />
                      </div>
                      <button
                        onClick={() => action(tx.id, 'approve')}
                        disabled={busy[tx.id] || !approveAmounts[tx.id]}
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
                );
              })}
            </div>
          )}

          {/* Processed history */}
          {processed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-[#94A3B8]">ประวัติที่ดำเนินการแล้ว</h2>
              <div className="glass overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(139,92,246,0.1)] text-[#94A3B8] text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">ผู้ใช้</th>
                      <th className="text-left px-4 py-3">รหัสซอง</th>
                      <th className="text-left px-4 py-3">มูลค่า</th>
                      <th className="text-left px-4 py-3">สถานะ</th>
                      <th className="text-left px-4 py-3">วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processed.map(tx => (
                      <tr key={tx.id} className="border-b border-[rgba(139,92,246,0.05)]">
                        <td className="px-4 py-3 text-white">{tx.username}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#94A3B8] max-w-[140px] truncate">{extractCode(tx.ref)}</td>
                        <td className="px-4 py-3 text-[#06B6D4] font-mono">฿{Number(tx.amount).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            tx.tx_status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/12 text-rose-400'
                          }`}>
                            {tx.tx_status === 'completed' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] text-xs">{new Date(tx.created_at).toLocaleDateString('th-TH')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
