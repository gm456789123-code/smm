'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BsArrowRepeat, BsExclamationTriangle, BsCheckCircle, BsSearch,
  BsBoxArrowUpRight, BsCopy, BsCheck2, BsArrowClockwise, BsFillPlayFill,
  BsCashStack, BsFilter,
} from 'react-icons/bs';

interface SmmLiveStatus {
  status: string;
  start_count?: string;
  remains?: string;
  charge?: string;
  error?: string;
}

interface Order {
  id: number;
  user_id: number;
  username: string;
  email?: string;
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
  smm?: SmmLiveStatus | null;
}

const STATUS_STYLE: Record<string, string> = {
  completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  processing:  'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  pending:     'bg-amber-500/15 text-amber-400 border-amber-500/30',
  cancelled:   'bg-rose-500/15 text-rose-400 border-rose-500/30',
  failed:      'bg-red-500/15 text-red-400 border-red-500/30',
  partial:     'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const SMM_STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  completed:   { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-300' },
  'in progress': { bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-300' },
  processing:  { bg: 'bg-cyan-500/20 border-cyan-500/40', text: 'text-cyan-300' },
  pending:     { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-300' },
  canceled:    { bg: 'bg-rose-500/20 border-rose-500/40', text: 'text-rose-300' },
  cancelled:   { bg: 'bg-rose-500/20 border-rose-500/40', text: 'text-rose-300' },
  partial:     { bg: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-300' },
};

function getServiceName(o: Order): string {
  if (o.note && o.note.includes(' | ')) return o.note.split(' | ')[0];
  if (o.note) return o.note;
  if (o.service_id) return `บริการ #${o.service_id}`;
  return o.tx_type === 'topup' ? 'เติมเงินเข้าระบบ' : 'คำสั่งซื้อ';
}

function getTargetLink(o: Order): string {
  if (o.link_url) return o.link_url;
  if (o.note && o.note.includes(' | ')) {
    const parts = o.note.split(' | ');
    return parts.slice(1).join(' | ');
  }
  return '';
}

export default function AdminOrdersPage() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [syncing, setSyncing]       = useState(false);
  const [retrying, setRetrying]     = useState<number | null>(null);
  const [refunding, setRefunding]   = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [result, setResult]         = useState<{ id?: number; ok: boolean; msg: string } | null>(null);
  const [copiedId, setCopiedId]     = useState<number | null>(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [providerFilter, setProv]   = useState('all');

  const load = useCallback(async (sync = false) => {
    if (sync) setSyncing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/orders${sync ? '?sync=1' : ''}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        if (sync) {
          setResult({ ok: true, msg: 'ซิงค์และอัปเดตสถานะสดจาก Provider สำเร็จเรียบร้อยแล้ว' });
        }
      }
    } catch {
      setResult({ ok: false, msg: 'ไม่สามารถโหลดข้อมูลออเดอร์ได้' });
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Auto load and auto sync on first visit
    load(true);
  }, [load]);

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
        setResult({ id: txId, ok: true, msg: `ส่งออเดอร์เข้า Provider สำเร็จ #${data.orderId}` });
        load(true);
      } else {
        setResult({ id: txId, ok: false, msg: data.error ?? 'เกิดข้อผิดพลาดในการส่งใหม่' });
      }
    } catch {
      setResult({ id: txId, ok: false, msg: 'ไม่สามารถเชื่อมต่อระบบได้' });
    } finally {
      setRetrying(null);
    }
  }

  async function updateStatus(txId: number, newStatus: string) {
    setUpdatingId(txId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, tx_status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === txId ? { ...o, tx_status: newStatus } : o));
        setResult({ id: txId, ok: true, msg: `อัปเดตสถานะเป็น "${newStatus}" สำเร็จ` });
      } else {
        const d = await res.json();
        setResult({ id: txId, ok: false, msg: d.error ?? 'อัปเดตไม่สำเร็จ' });
      }
    } catch {
      setResult({ id: txId, ok: false, msg: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setUpdatingId(null);
    }
  }

  async function refundOrder(tx: Order) {
    if (!confirm(`ยืนยันการคืนเงิน ฿${Number(tx.amount).toLocaleString()} ให้กับผู้ใช้ ${tx.username} ใช่หรือไม่?`)) {
      return;
    }
    setRefunding(tx.id);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund', id: tx.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ id: tx.id, ok: true, msg: `คืนเงินสำเร็จ ฿${data.refundAmount} ให้กับ ${tx.username} แล้ว` });
        load();
      } else {
        setResult({ id: tx.id, ok: false, msg: data.error ?? 'คืนเงินไม่สำเร็จ' });
      }
    } catch {
      setResult({ id: tx.id, ok: false, msg: 'เกิดข้อผิดพลาด' });
    } finally {
      setRefunding(null);
    }
  }

  function copyLink(id: number, link: string) {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Filtered orders
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const s = search.toLowerCase().trim();
      const matchSearch = !s || (
        String(o.id).includes(s) ||
        String(o.ref ?? '').toLowerCase().includes(s) ||
        o.username.toLowerCase().includes(s) ||
        getServiceName(o).toLowerCase().includes(s) ||
        getTargetLink(o).toLowerCase().includes(s)
      );

      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'error' ? (o.api_failed === 1 || o.tx_status === 'failed') : o.tx_status === statusFilter);

      const matchProvider = providerFilter === 'all' || (o.provider ?? 'km-social') === providerFilter;

      return matchSearch && matchStatus && matchProvider;
    });
  }, [orders, search, statusFilter, providerFilter]);

  // Statistics
  const spendTotal = orders.filter(o => o.tx_type === 'spend').reduce((a, o) => a + Number(o.amount || 0), 0);
  const pendingCount = orders.filter(o => o.tx_status === 'pending' || o.tx_status === 'in_progress').length;
  const completedCount = orders.filter(o => o.tx_status === 'completed').length;
  const failedCount = orders.filter(o => o.api_failed === 1 || o.tx_status === 'failed').length;

  return (
    <main className="flex-1 p-4 lg:p-6 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white flex items-center gap-2.5">
            จัดการออเดอร์
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[rgba(139,92,246,0.15)] text-[#a78bfa] border border-[rgba(139,92,246,0.3)] font-normal">
              {orders.length} รายการ
            </span>
          </h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">
            ตรวจสอบข้อมูลคำสั่งซื้อและซิงค์สถานะสดจากผู้ให้บริการ SMM Provider
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => load(true)}
            disabled={syncing || loading}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            <BsArrowClockwise size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'กำลังซิงค์สถานะสด...' : 'ซิงค์สถานะจาก Provider'}
          </button>

          <button
            onClick={() => load(false)}
            disabled={loading}
            className="glass-tab flex items-center gap-2 px-3.5 py-2 text-sm text-[#94A3B8] hover:text-white rounded-xl transition-colors"
          >
            <BsArrowRepeat size={14} className={loading && !syncing ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass p-4 rounded-2xl space-y-1">
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider">ยอดสั่งซื้อรวม (Spend)</p>
          <p className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-[#06B6D4] text-glow-cyan">
            ฿{spendTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-[#64748B]">จากผู้ใช้งานทั้งหมด</p>
        </div>

        <div className="glass p-4 rounded-2xl space-y-1">
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider">กำลังดำเนินการ (Active)</p>
          <p className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-amber-400">
            {pendingCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-400/80">Pending & In Progress</p>
        </div>

        <div className="glass p-4 rounded-2xl space-y-1">
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider">สำเร็จแล้ว (Completed)</p>
          <p className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-emerald-400">
            {completedCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400/80">ส่งยอดเรียบร้อย</p>
        </div>

        <div className="glass p-4 rounded-2xl space-y-1">
          <p className="text-xs text-[#94A3B8] uppercase tracking-wider">ข้อผิดพลาด (API Error)</p>
          <p className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-rose-400">
            {failedCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-rose-400/80">ต้องตรวจสอบหรือ Retry</p>
        </div>
      </div>

      {/* Result Toast */}
      {result && (
        <div className={[
          'flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm border animate-in fade-in',
          result.ok
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        ].join(' ')}>
          {result.ok ? <BsCheckCircle size={16} className="shrink-0" /> : <BsExclamationTriangle size={16} className="shrink-0" />}
          <span className="flex-1">{result.msg}</span>
          <button onClick={() => setResult(null)} className="text-current opacity-60 hover:opacity-100 p-1">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <BsSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" size={14} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา ID, Ref ออเดอร์, Username, ลิงก์, ชื่อบริการ..."
              className="glass w-full pl-10 pr-4 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.15)] focus:border-[rgba(139,92,246,0.45)] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#94A3B8]">
              <BsFilter size={14} />
              <span>Provider:</span>
            </div>
            <select
              value={providerFilter}
              onChange={e => setProv(e.target.value)}
              className="glass px-3 py-2 text-xs text-[#F1F5F9] bg-[rgba(13,18,34,0.9)] outline-none rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.45)] cursor-pointer"
            >
              <option value="all" className="bg-[#0d1222]">ทั้งหมด (All)</option>
              <option value="km-social" className="bg-[#0d1222]">km-social</option>
              <option value="24social" className="bg-[#0d1222]">24social</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด', count: orders.length },
            { id: 'pending', label: 'Pending', count: orders.filter(o => o.tx_status === 'pending').length },
            { id: 'in_progress', label: 'In Progress', count: orders.filter(o => o.tx_status === 'in_progress').length },
            { id: 'completed', label: 'Completed', count: orders.filter(o => o.tx_status === 'completed').length },
            { id: 'partial', label: 'Partial', count: orders.filter(o => o.tx_status === 'partial').length },
            { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.tx_status === 'cancelled').length },
            { id: 'error', label: 'API Error', count: failedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatus(tab.id)}
              className={[
                'px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5',
                statusFilter === tab.id
                  ? 'bg-[rgba(139,92,246,0.25)] text-white border border-[rgba(139,92,246,0.45)]'
                  : 'text-[#94A3B8] hover:text-white hover:bg-white/5 border border-transparent',
              ].join(' ')}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/80 font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="glass rounded-2xl overflow-hidden border border-[rgba(139,92,246,0.15)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-xs text-[#94A3B8] uppercase tracking-wider border-b border-[rgba(139,92,246,0.15)] bg-[rgba(255,255,255,0.02)]">
                <th className="py-3.5 px-4 font-semibold">ID / เวลา</th>
                <th className="py-3.5 px-4 font-semibold">ผู้ใช้งาน</th>
                <th className="py-3.5 px-4 font-semibold min-w-[240px]">บริการที่ซื้อ</th>
                <th className="py-3.5 px-4 font-semibold min-w-[200px]">ลิงก์เป้าหมาย</th>
                <th className="py-3.5 px-4 font-semibold">ยอดเงิน / จำนวน</th>
                <th className="py-3.5 px-4 font-semibold min-w-[190px]">สถานะสดจาก Provider</th>
                <th className="py-3.5 px-4 font-semibold">สถานะระบบ</th>
                <th className="py-3.5 px-4 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[rgba(139,92,246,0.07)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#94A3B8]">
                    <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
                      <BsArrowRepeat size={24} className="animate-spin text-[#8B5CF6]" />
                      <span>กำลังโหลดและซิงค์ข้อมูล...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-[#94A3B8]">
                    ไม่พบรายการออเดอร์ที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : filtered.map(o => {
                const serviceName = getServiceName(o);
                const targetLink = getTargetLink(o);
                const isFailed = o.api_failed === 1 || o.tx_status === 'failed';
                const smmStatusLower = (o.smm?.status || '').toLowerCase();
                const smmBadge = SMM_STATUS_BADGE[smmStatusLower] || {
                  bg: 'bg-slate-500/15 border-slate-500/30',
                  text: 'text-slate-300',
                };

                return (
                  <tr
                    key={o.id}
                    className={[
                      'hover:bg-[rgba(139,92,246,0.04)] transition-colors',
                      isFailed ? 'bg-rose-500/[0.03]' : '',
                    ].join(' ')}
                  >
                    {/* ID / Time */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-mono font-bold text-xs text-white">#{o.id}</span>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5 font-mono">
                        {new Date(o.created_at).toLocaleDateString('th-TH')}<br />
                        <span className="text-[#64748B]">
                          {new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                    </td>

                    {/* User */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="font-semibold text-white text-xs block">{o.username}</span>
                      <span className="text-[10px] text-[#64748B] font-mono">ID: {o.user_id}</span>
                      {o.email && (
                        <p className="text-[10px] text-[#94A3B8] truncate max-w-[120px]" title={o.email}>
                          {o.email}
                        </p>
                      )}
                    </td>

                    {/* Service Name + Details */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-1">
                        <p className="font-medium text-white text-xs leading-snug line-clamp-2" title={serviceName}>
                          {serviceName}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(139,92,246,0.15)] text-[#A78BFA] border border-[rgba(139,92,246,0.3)] uppercase">
                            {o.provider ?? 'km-social'}
                          </span>
                          {o.service_id && (
                            <span className="text-[10px] font-mono text-[#94A3B8]">
                              Svc #{o.service_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target Link */}
                    <td className="py-3.5 px-4 align-top">
                      {targetLink ? (
                        <div className="space-y-1 max-w-[220px]">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={targetLink.startsWith('http') ? targetLink : `https://${targetLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#06B6D4] hover:underline truncate inline-flex items-center gap-1"
                              title={targetLink}
                            >
                              <span className="truncate">{targetLink}</span>
                              <BsBoxArrowUpRight size={10} className="shrink-0" />
                            </a>
                            <button
                              onClick={() => copyLink(o.id, targetLink)}
                              className="text-[#64748B] hover:text-white p-1 rounded transition-colors shrink-0"
                              title="คัดลอกลิงก์"
                            >
                              {copiedId === o.id ? <BsCheck2 size={12} className="text-emerald-400" /> : <BsCopy size={11} />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-[#64748B]">—</span>
                      )}
                    </td>

                    {/* Amount & Qty */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-mono font-bold text-xs text-[#06B6D4]">
                        ฿{Number(o.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {o.qty && (
                        <p className="text-[11px] text-[#94A3B8] font-mono">
                          {Number(o.qty).toLocaleString()} ชิ้น
                        </p>
                      )}
                    </td>

                    {/* Live Provider Status (Callback) */}
                    <td className="py-3.5 px-4 align-top">
                      {isFailed ? (
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                          <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                            <BsExclamationTriangle size={10} /> API Failed
                          </span>
                          <p className="text-[10px] text-rose-300/80 leading-tight break-words">
                            {o.api_error || 'คำสั่งซื้อไม่ถึง Provider'}
                          </p>
                        </div>
                      ) : o.ref && o.ref !== 'null' && o.ref !== 'undefined' ? (
                        <div className="p-2 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(139,92,246,0.15)] space-y-1.5">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] font-mono text-[#A78BFA] font-bold">
                              #{o.ref}
                            </span>
                            {o.smm?.status && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${smmBadge.bg} ${smmBadge.text}`}>
                                {o.smm.status}
                              </span>
                            )}
                          </div>
                          {o.smm && (
                            <div className="text-[10px] text-[#94A3B8] font-mono space-y-0.5 border-t border-white/5 pt-1">
                              {o.smm.start_count !== undefined && o.smm.start_count !== '' && (
                                <div>เริ่ม: <span className="text-white">{o.smm.start_count}</span></div>
                              )}
                              {o.smm.remains !== undefined && o.smm.remains !== '' && (
                                <div>คงเหลือ: <span className="text-[#06B6D4]">{o.smm.remains}</span></div>
                              )}
                            </div>
                          )}
                          {!o.smm && (
                            <p className="text-[10px] text-[#64748B] italic">กดซิงค์เพื่อดูสถานะสด</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#64748B] italic">ไม่มีเลขออเดอร์ Provider</span>
                      )}
                    </td>

                    {/* System Status */}
                    <td className="py-3.5 px-4 align-top">
                      <select
                        value={o.tx_status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        disabled={updatingId === o.id}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer outline-none bg-[rgba(13,18,34,0.9)] transition-colors ${STATUS_STYLE[o.tx_status] ?? 'bg-slate-500/10 text-slate-300 border-slate-500/20'}`}
                      >
                        <option value="pending" className="bg-[#0d1222] text-amber-400">pending</option>
                        <option value="in_progress" className="bg-[#0d1222] text-blue-400">in_progress</option>
                        <option value="completed" className="bg-[#0d1222] text-emerald-400">completed</option>
                        <option value="partial" className="bg-[#0d1222] text-purple-400">partial</option>
                        <option value="cancelled" className="bg-[#0d1222] text-rose-400">cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isFailed && (
                          <button
                            onClick={() => retry(o.id)}
                            disabled={retrying === o.id}
                            className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-all text-xs font-medium inline-flex items-center gap-1"
                            title="Retry ส่งออเดอร์ใหม่"
                          >
                            <BsFillPlayFill size={14} className={retrying === o.id ? 'animate-spin' : ''} />
                            Retry
                          </button>
                        )}

                        {o.tx_status !== 'cancelled' && (
                          <button
                            onClick={() => refundOrder(o)}
                            disabled={refunding === o.id}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/25 transition-all text-xs inline-flex items-center gap-1"
                            title="คืนเงินให้ลูกค้า"
                          >
                            <BsCashStack size={13} />
                            คืนเงิน
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

