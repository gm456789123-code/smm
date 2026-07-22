'use client';

import { useEffect, useState, useCallback } from 'react';
import { BsArrowRepeat, BsExclamationTriangle, BsCheckCircle } from 'react-icons/bs';

interface Order {
  id: number;
  username: string;
  tx_type: string;
  amount: number;
  ref: string | null;
  tx_status: string;
  note: string | null;
  provider: string | null;
  api_failed: number;
  api_error: string | null;
  service_id: number | null;
  link_url: string | null;
  qty: number | null;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed:    'bg-red-500/10 text-red-400 border-red-500/20',
  partial:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function AdminOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [loading, setLoading]   = useState(true);
  const [retrying, setRetrying] = useState<number | null>(null);
  const [result, setResult]     = useState<{ id: number; ok: boolean; msg: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function retry(txId: number) {
    setRetrying(txId);
    setResult(null);
    try {
      const res = await fetch('/api/admin/orders/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ id: txId, ok: true, msg: `ส่งออเดอร์สำเร็จ #${data.orderId}` });
        load();
      } else {
        setResult({ id: txId, ok: false, msg: data.error ?? 'เกิดข้อผิดพลาด' });
      }
    } catch {
      setResult({ id: txId, ok: false, msg: 'ไม่สามารถเชื่อมต่อได้' });
    } finally {
      setRetrying(null);
    }
  }

  const total = orders.reduce((a, o) =>
    a + (o.tx_type === 'topup' && o.tx_status === 'completed' ? Number(o.amount) : 0), 0
  );
  const failedCount = orders.filter(o => o.api_failed).length;

  return (
    <main className="flex-1 p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">จัดการออเดอร์</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">
            {orders.length} รายการ · รายได้รวม ฿{total.toLocaleString()}
            {failedCount > 0 && (
              <span className="ml-2 text-red-400 font-medium">· {failedCount} รายการ API Error</span>
            )}
          </p>
        </div>
        <button onClick={load}
          className="glass-tab flex items-center gap-2 px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors">
          <BsArrowRepeat size={14} className={loading ? 'animate-spin' : ''} />
          รีเฟรช
        </button>
      </div>

      {/* Result toast */}
      {result && (
        <div className={[
          'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm border',
          result.ok
            ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/8 border-red-500/20 text-red-400',
        ].join(' ')}>
          {result.ok ? <BsCheckCircle size={15} /> : <BsExclamationTriangle size={15} />}
          {result.msg}
          <button onClick={() => setResult(null)} className="ml-auto text-current opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="glass p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#94A3B8] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">ประเภท</th>
                <th className="pb-3 pr-4">จำนวน</th>
                <th className="pb-3 pr-4">Ref / ข้อมูล</th>
                <th className="pb-3 pr-4">สถานะ</th>
                <th className="pb-3 pr-4">วันที่</th>
                <th className="pb-3">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
              {loading ? (
                <tr><td colSpan={8} className="py-10 text-center text-[#94A3B8] animate-pulse">กำลังโหลด...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-[#94A3B8]">ยังไม่มีออเดอร์</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className={[
                  'hover:bg-[rgba(139,92,246,0.04)] transition-colors',
                  o.api_failed ? 'bg-[rgba(239,68,68,0.03)]' : '',
                ].join(' ')}>
                  <td className="py-3 pr-4 font-mono text-xs text-[#94A3B8]">{o.id}</td>
                  <td className="py-3 pr-4 text-[#a78bfa] font-medium">{o.username}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.1)] text-[#a78bfa]">{o.tx_type}</span>
                  </td>
                  <td className="py-3 pr-4 font-mono font-semibold text-[#06B6D4]">฿{Number(o.amount).toLocaleString()}</td>

                  {/* Ref / Info */}
                  <td className="py-3 pr-4 max-w-[220px]">
                    {o.api_failed ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 uppercase tracking-wide">
                            {o.provider ?? 'unknown'}
                          </span>
                          {o.service_id && (
                            <span className="text-[10px] text-[#94A3B8]">svc #{o.service_id} · qty {o.qty?.toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-red-400/80 truncate" title={o.api_error ?? ''}>
                          {o.api_error ?? 'API error'}
                        </p>
                        {o.link_url && (
                          <p className="text-[10px] text-[#94A3B8] truncate">{o.link_url}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8] truncate block">{o.ref ?? o.note ?? '—'}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 pr-4">
                    {o.api_failed ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                        <BsExclamationTriangle size={10} />
                        API Error
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[o.tx_status] ?? 'bg-[rgba(71,85,105,0.2)] text-[#94A3B8] border-transparent'}`}>
                        {o.tx_status}
                      </span>
                    )}
                  </td>

                  <td className="py-3 pr-4 text-xs text-[#94A3B8]">
                    {new Date(o.created_at).toLocaleDateString('th-TH')}<br />
                    <span className="text-[10px] text-[#94A3B8]">
                      {new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>

                  {/* Retry button */}
                  <td className="py-3">
                    {(o.api_failed || o.tx_status === 'pending') ? (
                      <button
                        onClick={() => retry(o.id)}
                        disabled={retrying === o.id}
                        className={[
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
                          o.api_failed
                            ? 'bg-[rgba(139,92,246,0.12)] text-[#a78bfa] hover:bg-[rgba(139,92,246,0.22)] hover:text-white border-[rgba(139,92,246,0.25)]'
                            : 'bg-[rgba(245,158,11,0.10)] text-amber-400 hover:bg-[rgba(245,158,11,0.20)] hover:text-white border-amber-500/25',
                        ].join(' ')}
                      >
                        <BsArrowRepeat size={12} className={retrying === o.id ? 'animate-spin' : ''} />
                        {retrying === o.id ? 'กำลังส่ง...' : 'Retry'}
                      </button>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
