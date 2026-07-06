'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Summary { balance: number; total_topup: number; total_spent: number; tx_count: number; }
interface Tx { id: number; tx_type: string; amount: number; tx_status: string; created_at: string; }

export default function BalancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txs, setTxs]         = useState<Tx[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/user/me').then(r => r.json()),
      fetch('/api/user/transactions').then(r => r.json()),
    ]).then(([user, transactions]) => {
      const topup = transactions.filter((t: Tx) => t.tx_type === 'topup' && t.tx_status === 'completed').reduce((a: number, t: Tx) => a + Number(t.amount), 0);
      const spent = transactions.filter((t: Tx) => t.tx_type === 'spend').reduce((a: number, t: Tx) => a + Number(t.amount), 0);
      setSummary({ balance: Number(user.balance), total_topup: topup, total_spent: spent, tx_count: transactions.length });
      setTxs(transactions.slice(0, 20));
    });
  }, []);

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">ยอดเงิน</h1>
          <p className="text-[#475569] text-sm mt-0.5">ประวัติและสรุปยอดเงิน</p>
        </div>
        <Link href="/topup" className="glass-tab glass-tab-active px-5 py-2.5 text-sm font-semibold text-[#c4b5fd] hover:text-white">
          + เติมเงิน
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ยอดคงเหลือ',     value: `฿${summary?.balance.toFixed(2) ?? '0.00'}`,     color: 'text-[#06B6D4] text-glow-cyan',   border: 'border-t-[#06B6D4]/60' },
          { label: 'เติมเงินรวม',   value: `฿${summary?.total_topup.toFixed(2) ?? '0.00'}`, color: 'text-emerald-400',                border: 'border-t-emerald-400/60' },
          { label: 'ใช้จ่ายรวม',    value: `฿${summary?.total_spent.toFixed(2) ?? '0.00'}`, color: 'text-rose-400',                   border: 'border-t-rose-400/60' },
          { label: 'ธุรกรรมทั้งหมด', value: summary?.tx_count ?? 0,                        color: 'text-[#8B5CF6] text-glow-indigo', border: 'border-t-[#8B5CF6]/60' },
        ].map(s => (
          <div key={s.label} className={`glass border-t-2 ${s.border} p-5`}>
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest">{s.label}</p>
            <p className={`font-[family-name:var(--font-inter)] text-xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="glass p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white text-base">ธุรกรรมล่าสุด</h2>
        <div className="space-y-2">
          {txs.length === 0 ? (
            <p className="py-8 text-center text-[#475569]">ยังไม่มีธุรกรรม</p>
          ) : txs.map(t => (
            <div key={t.id} className="glass-tab flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${t.tx_type === 'topup' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {t.tx_type === 'topup' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">{t.tx_type === 'topup' ? 'เติมเงิน' : 'ใช้จ่าย'}</p>
                  <p className="text-xs text-[#475569]">{new Date(t.created_at).toLocaleDateString('th-TH')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-semibold ${t.tx_type === 'topup' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.tx_type === 'topup' ? '+' : '-'}฿{Number(t.amount).toLocaleString()}
                </p>
                <span className={`text-[10px] ${t.tx_status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{t.tx_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
