'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BsArrowClockwise, BsCheckCircle, BsXCircle, BsClockHistory,
  BsLightningCharge, BsExclamationCircle, BsLink45Deg,
} from 'react-icons/bs';

interface Order {
  id: number;
  amount: number;
  ref: string | null;
  tx_status: string;
  note: string;
  provider: string;
  api_failed: number;
  service_id: number;
  link_url: string;
  qty: number;
  created_at: string;
  // live status fields (populated after refresh)
  smm?: {
    status: string;
    start_count: string;
    remains: string;
    charge: string;
  } | null;
  _refreshing?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:     { label: 'รอดำเนินการ', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   icon: <BsClockHistory size={11} /> },
  in_progress: { label: 'กำลังดำเนินการ', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: <BsLightningCharge size={11} /> },
  completed:   { label: 'สำเร็จ',      cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <BsCheckCircle size={11} /> },
  partial:     { label: 'บางส่วน',     cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: <BsExclamationCircle size={11} /> },
  cancelled:   { label: 'ยกเลิก',      cls: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: <BsXCircle size={11} /> },
  failed:      { label: 'ล้มเหลว',     cls: 'bg-red-500/10 text-red-400 border-red-500/20',       icon: <BsXCircle size={11} /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Progress({ order }: { order: Order }) {
  if (!order.smm || !order.qty) return null;
  const start  = Number(order.smm.start_count ?? 0);
  const remains = Number(order.smm.remains ?? 0);
  const done   = Math.max(0, order.qty - remains);
  const pct    = Math.min(100, Math.round((done / order.qty) * 100));
  if (order.tx_status === 'completed') return (
    <div className="w-full bg-emerald-500/10 rounded-full h-1">
      <div className="bg-emerald-400 h-1 rounded-full w-full" />
    </div>
  );
  if (order.tx_status !== 'in_progress') return null;
  return (
    <div className="space-y-0.5">
      <div className="w-full bg-[rgba(139,92,246,0.10)] rounded-full h-1.5">
        <div className="bg-[#8B5CF6] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-[#94A3B8]">
        เริ่ม {start.toLocaleString()} · เหลือ {remains.toLocaleString()} · {pct}%
      </p>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders?limit=50')
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const refreshOrder = useCallback(async (id: number) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, _refreshing: true } : o));
    try {
      const res  = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      setOrders(prev => prev.map(o => o.id === id ? { ...data, _refreshing: false } : o));
    } catch {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, _refreshing: false } : o));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    const active = orders.filter(o => o.ref && !['completed','cancelled','failed'].includes(o.tx_status));
    await Promise.all(active.map(o => refreshOrder(o.id)));
  }, [orders, refreshOrder]);

  const activeCount = orders.filter(o => o.ref && !['completed','cancelled','failed'].includes(o.tx_status)).length;

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">ออเดอร์ของฉัน</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">{orders.length} ออเดอร์</p>
        </div>
        {activeCount > 0 && (
          <button
            onClick={refreshAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-[rgba(139,92,246,0.2)] hover:border-[rgba(139,92,246,0.45)] hover:bg-[rgba(139,92,246,0.08)] transition-all"
          >
            <BsArrowClockwise size={14} />
            รีเฟรชทั้งหมด ({activeCount})
          </button>
        )}
      </div>

      <div className="glass overflow-hidden">
        {loading ? (
          <p className="py-12 text-center text-[#94A3B8] animate-pulse">กำลังโหลด...</p>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-[#94A3B8]">ยังไม่มีออเดอร์</p>
        ) : (
          <div className="divide-y divide-[rgba(139,92,246,0.06)]">
            {orders.map(order => {
              // Parse service name from note "ServiceName | URL"
              const serviceName = order.note?.split(' | ')[0] ?? `Service #${order.service_id}`;
              const isActive    = order.ref && !['completed','cancelled','failed'].includes(order.tx_status);

              return (
                <div key={order.id} className="p-4 hover:bg-[rgba(139,92,246,0.03)] transition-colors">
                  <div className="flex items-start gap-4 flex-wrap">

                    {/* Left: info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-white">#{order.ref ?? order.id}</span>
                        <StatusBadge status={order.tx_status} />
                        {order.api_failed === 1 && (
                          <span className="text-[10px] text-rose-400 border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 rounded-full">
                            API Error
                          </span>
                        )}
                      </div>

                      <p className="text-base font-semibold text-white truncate">{serviceName}</p>

                      {order.link_url && (
                        <a
                          href={order.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#94A3B8] hover:text-[#8B5CF6] transition-colors truncate max-w-[320px]"
                        >
                          <BsLink45Deg size={12} />
                          {order.link_url}
                        </a>
                      )}

                      <Progress order={order} />
                    </div>

                    {/* Right: stats + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right space-y-0.5">
                        <p className="text-lg font-bold font-mono text-[#06B6D4]">
                          ฿{Number(order.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-[#94A3B8]">
                          {Number(order.qty).toLocaleString()} ชิ้น
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {new Date(order.created_at).toLocaleDateString('th-TH', {
                            day: '2-digit', month: 'short', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {isActive && (
                        <button
                          onClick={() => refreshOrder(order.id)}
                          disabled={order._refreshing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#94A3B8] hover:text-white border border-[rgba(139,92,246,0.2)] hover:border-[rgba(139,92,246,0.4)] hover:bg-[rgba(139,92,246,0.08)] transition-all disabled:opacity-40"
                        >
                          <BsArrowClockwise size={12} className={order._refreshing ? 'animate-spin' : ''} />
                          {order._refreshing ? 'กำลังตรวจ...' : 'ตรวจสถานะ'}
                        </button>
                      )}
                    </div>

                  </div>

                  {/* SMM live data row */}
                  {order.smm && (
                    <div className="mt-2 pt-2 border-t border-[rgba(139,92,246,0.06)] flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#94A3B8]">
                      <span>สถานะ provider: <span className="text-[#94A3B8]">{order.smm.status}</span></span>
                      {order.smm.start_count && (
                        <span>เริ่มต้น: <span className="text-[#94A3B8]">{Number(order.smm.start_count).toLocaleString()}</span></span>
                      )}
                      {order.smm.remains && Number(order.smm.remains) > 0 && (
                        <span>เหลือ: <span className="text-[#94A3B8]">{Number(order.smm.remains).toLocaleString()}</span></span>
                      )}
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
