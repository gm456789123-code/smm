'use client';

import { useEffect, useState } from 'react';

interface Transaction {
  id: number; tx_type: string; amount: number;
  ref: string; tx_status: string; note: string; created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400',
  pending:   'bg-amber-500/10 text-amber-400',
  failed:    'bg-red-500/10 text-red-400',
};

export default function OrdersPage() {
  const [txs, setTxs]       = useState<Transaction[]>([]);
  const [loading, setLoad]  = useState(true);

  useEffect(() => {
    fetch('/api/user/transactions').then(r => r.json()).then(d => {
      setTxs(Array.isArray(d) ? d : []);
      setLoad(false);
    }).catch(() => setLoad(false));
  }, []);

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">ออเดอร์ของฉัน</h1>
        <p className="text-[#475569] text-sm mt-0.5">ประวัติธุรกรรมทั้งหมด</p>
      </div>

      <div className="glass p-5">
        {loading ? (
          <p className="py-10 text-center text-[#475569] animate-pulse">กำลังโหลด...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">ประเภท</th>
                  <th className="pb-3 pr-4">จำนวน</th>
                  <th className="pb-3 pr-4">Ref</th>
                  <th className="pb-3 pr-4">สถานะ</th>
                  <th className="pb-3">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
                {txs.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-[#475569]">ยังไม่มีธุรกรรม</td></tr>
                ) : txs.map(t => (
                  <tr key={t.id} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-[#475569]">{t.id}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.1)] text-[#a78bfa]">{t.tx_type}</span>
                    </td>
                    <td className="py-3 pr-4 font-mono font-semibold text-[#06B6D4]">฿{Number(t.amount).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-xs text-[#475569] max-w-[200px] truncate">{t.ref ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[t.tx_status] ?? 'bg-[rgba(71,85,105,0.2)] text-[#475569]'}`}>
                        {t.tx_status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-[#475569]">
                      {new Date(t.created_at).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
