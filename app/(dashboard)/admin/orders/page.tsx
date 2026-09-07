'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useLiveRefresh } from '@/lib/use-live-refresh';
import {
  BsArrowRepeat, BsExclamationTriangle, BsCheckCircle, BsSearch,
  BsBoxArrowUpRight, BsCopy, BsCheck2, BsArrowClockwise, BsFillPlayFill,
  BsCashStack, BsFilter, BsLockFill, BsUnlockFill, BsPlusLg, BsX,
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
  status_locked: number;
  created_at: string;
  smm?: SmmLiveStatus | null;
  sync_error?: boolean;
}

interface SimpleUser { id: number; username: string; email: string | null; balance: number; }

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
  const [syncMessage, setSyncMessage] = useState('กำลังอัปเดตข้อมูล');
  const [lockingId, setLockingId]   = useState<number | null>(null);
  const revision = useRef(0);

  // Create-order modal
  const [showCreate, setShowCreate] = useState(false);
  const [users, setUsers]           = useState<SimpleUser[]>([]);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({
    userQuery: '', userId: 0,
    provider: 'km-social', ref: '', serviceName: '', link: '', qty: '', amount: '',
    txStatus: 'pending', deductBalance: false,
  });

  useEffect(() => {
    if (!showCreate || users.length > 0) return;
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [showCreate, users.length]);

  const userMatches = useMemo(() => {
    const q = form.userQuery.toLowerCase().trim();
    if (!q) return [];
    return users.filter(u => u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)).slice(0, 8);
  }, [users, form.userQuery]);

  function resetCreateForm() {
    setForm({ userQuery: '', userId: 0, provider: 'km-social', ref: '', serviceName: '', link: '', qty: '', amount: '', txStatus: 'pending', deductBalance: false });
    setCreateError('');
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.ref.trim() || !form.serviceName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: form.userId,
          provider: form.provider,
          ref: form.ref.trim(),
          serviceName: form.serviceName.trim(),
          link: form.link.trim(),
          qty: form.qty === '' ? null : Number(form.qty),
          amount: form.amount === '' ? 0 : Number(form.amount),
          txStatus: form.txStatus,
          deductBalance: form.deductBalance,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? 'สร้างออเดอร์ไม่สำเร็จ');
      } else {
        setShowCreate(false);
        resetCreateForm();
        setResult({ ok: true, msg: `สร้างออเดอร์ให้ ${data.username} สำเร็จ` });
        revision.current++;
        load();
      }
    } catch {
      setCreateError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setCreating(false);
    }
  }

  async function toggleLock(o: Order) {
    setLockingId(o.id);
    revision.current++;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: o.id, status_locked: o.status_locked ? false : true }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status_locked: o.status_locked ? 0 : 1 } : x));
      }
    } finally {
      revision.current++;
      setLockingId(null);
    }
  }

  // Filters
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('all');
  const [providerFilter, setProv]   = useState('all');

  const loadOrders = useCallback(async (signal: AbortSignal) => {
    const version = revision.current;
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/orders?sync=1', { signal, cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        setOrders([]);
        throw new Error('เซสชันหมดอายุหรือไม่มีสิทธิ์ กรุณาเข้าสู่ระบบใหม่');
      }
      if (!res.ok) throw new Error('อัปเดตไม่ได้ กำลังแสดงข้อมูลล่าสุดที่โหลดสำเร็จ');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('ข้อมูลออเดอร์ไม่ถูกต้อง');
      if (signal.aborted || version !== revision.current) return;
      setOrders(data);
      setSyncMessage(data.some((order: Order) => order.sync_error)
        ? 'บางออเดอร์ซิงค์ไม่ได้ ระบบจะลองใหม่'
        : `อัปเดตล่าสุด ${new Date().toLocaleTimeString('th-TH')} · อัตโนมัติทุก 30 วินาที`);
    } catch (error) {
      if (!signal.aborted) setSyncMessage(error instanceof Error ? error.message : 'อัปเดตข้อมูลไม่ได้');
      throw error;
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  const load = useLiveRefresh(loadOrders, 30_000);

  async function retry(txId: number) {
    revision.current++;
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
        window.dispatchEvent(new Event('smm-data-changed'));
      } else {
        setResult({ id: txId, ok: false, msg: data.error ?? 'เกิดข้อผิดพลาดในการส่งใหม่' });
      }
    } catch {
      setResult({ id: txId, ok: false, msg: 'ไม่สามารถเชื่อมต่อระบบได้' });
    } finally {
      revision.current++;
      load();
      setRetrying(null);
    }
  }

  async function updateStatus(txId: number, newStatus: string) {
    revision.current++;
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
      revision.current++;
      load();
      setUpdatingId(null);
    }
  }

  async function refundOrder(tx: Order) {
    if (!confirm(`ยืนยันการคืนเงิน ฿${Number(tx.amount).toLocaleString()} ให้กับผู้ใช้ ${tx.username} ใช่หรือไม่?`)) {
      return;
    }
    setRefunding(tx.id);
    revision.current++;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund', id: tx.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ id: tx.id, ok: true, msg: `คืนเงินสำเร็จ ฿${data.refundAmount} ให้กับ ${tx.username} แล้ว` });
        window.dispatchEvent(new Event('smm-data-changed'));
      } else {
        setResult({ id: tx.id, ok: false, msg: data.error ?? 'คืนเงินไม่สำเร็จ' });
      }
    } catch {
      setResult({ id: tx.id, ok: false, msg: 'เกิดข้อผิดพลาด' });
    } finally {
      revision.current++;
      load();
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
            onClick={() => { resetCreateForm(); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
          >
            <BsPlusLg size={14} />
            สร้างออเดอร์ให้ user
          </button>

          <button
            onClick={load}
            disabled={syncing || loading}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            <BsArrowClockwise size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'กำลังซิงค์สถานะสด...' : 'ซิงค์สถานะจาก Provider'}
          </button>

          <button
            onClick={load}
            disabled={loading}
            className="glass-tab flex items-center gap-2 px-3.5 py-2 text-sm text-[#94A3B8] hover:text-white rounded-xl transition-colors"
          >
            <BsArrowRepeat size={14} className={loading && !syncing ? 'animate-spin' : ''} />
            รีเฟรช
          </button>
        </div>
      </div>

      <p role="status" className="text-xs text-[#94A3B8]">{syncMessage}</p>

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
                      <div className="flex items-center gap-1.5">
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
                        <button
                          onClick={() => toggleLock(o)}
                          disabled={lockingId === o.id}
                          title={o.status_locked ? 'ล็อกอยู่ — ไม่ sync อัตโนมัติ (กดเพื่อปลดล็อก)' : 'ปลดล็อกอยู่ — sync อัตโนมัติได้ (กดเพื่อล็อก)'}
                          className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                            o.status_locked
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                              : 'bg-white/5 text-[#64748B] border-white/10 hover:text-white'
                          }`}
                        >
                          {o.status_locked ? <BsLockFill size={11} /> : <BsUnlockFill size={11} />}
                        </button>
                      </div>
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

      {/* Create manual order modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog" aria-modal="true">
          <div className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-white">
                สร้างออเดอร์ให้ user
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-[#94A3B8] hover:text-white transition-colors">
                <BsX size={20} />
              </button>
            </div>
            <p className="text-xs text-[#94A3B8] -mt-2">
              สำหรับกรณีซื้อออเดอร์จากเว็บต้นทางเอง แล้วต้องการนำเลขออเดอร์มาผูกกับ user เพื่อให้ user ติดตามสถานะได้ (ระบบจะ sync สถานะจาก provider ให้อัตโนมัติถ้า provider/ref ถูกต้อง)
            </p>

            <form onSubmit={submitCreate} className="space-y-3.5">
              {/* User picker */}
              <div className="space-y-1.5 relative">
                <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ผู้ใช้ *</label>
                {form.userId ? (
                  <div className="flex items-center justify-between glass px-3 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <span className="text-sm text-white">{users.find(u => u.id === form.userId)?.username}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, userId: 0, userQuery: '' }))}
                      className="text-[#94A3B8] hover:text-white text-xs">เปลี่ยน</button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text" value={form.userQuery}
                      onChange={e => setForm(f => ({ ...f, userQuery: e.target.value }))}
                      placeholder="พิมพ์ username หรือ email เพื่อค้นหา..."
                      className="w-full glass px-3.5 py-2.5 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                    />
                    {userMatches.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 glass rounded-xl border border-[rgba(139,92,246,0.25)] overflow-hidden max-h-48 overflow-y-auto">
                        {userMatches.map(u => (
                          <button key={u.id} type="button"
                            onClick={() => setForm(f => ({ ...f, userId: u.id, userQuery: '' }))}
                            className="w-full text-left px-3.5 py-2 text-sm text-[#CBD5E1] hover:bg-[rgba(139,92,246,0.12)] transition-colors flex items-center justify-between"
                          >
                            <span>{u.username}</span>
                            <span className="text-[10px] text-[#64748B]">฿{Number(u.balance).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">Provider</label>
                  <select
                    value={form.provider}
                    onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                    className="w-full glass px-3 py-2.5 text-sm text-white bg-[rgba(13,18,34,0.9)] outline-none rounded-xl border border-[rgba(139,92,246,0.2)]"
                  >
                    <option value="km-social" className="bg-[#0d1222]">km-social</option>
                    <option value="24social" className="bg-[#0d1222]">24social</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">เลขออเดอร์ Provider (ref) *</label>
                  <input
                    type="text" value={form.ref}
                    onChange={e => setForm(f => ({ ...f, ref: e.target.value }))}
                    placeholder="เช่น 123456"
                    className="w-full glass px-3 py-2.5 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ชื่อบริการ *</label>
                <input
                  type="text" value={form.serviceName}
                  onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
                  placeholder="เช่น Instagram Followers"
                  className="w-full glass px-3 py-2.5 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ลิงก์เป้าหมาย</label>
                <input
                  type="text" value={form.link}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full glass px-3 py-2.5 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">จำนวน</label>
                  <input
                    type="number" value={form.qty}
                    onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                    placeholder="1000"
                    className="w-full glass px-3 py-2.5 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ยอดเงิน (฿)</label>
                  <input
                    type="number" step="0.01" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full glass px-3 py-2.5 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">สถานะเริ่มต้น</label>
                  <select
                    value={form.txStatus}
                    onChange={e => setForm(f => ({ ...f, txStatus: e.target.value }))}
                    className="w-full glass px-3 py-2.5 text-sm text-white bg-[rgba(13,18,34,0.9)] outline-none rounded-xl border border-[rgba(139,92,246,0.2)]"
                  >
                    <option value="pending" className="bg-[#0d1222]">pending</option>
                    <option value="in_progress" className="bg-[#0d1222]">in_progress</option>
                    <option value="completed" className="bg-[#0d1222]">completed</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-[#CBD5E1] cursor-pointer">
                <input
                  type="checkbox" checked={form.deductBalance}
                  onChange={e => setForm(f => ({ ...f, deductBalance: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#8B5CF6]"
                />
                หักยอดเงิน ฿{form.amount || 0} จากบัญชีลูกค้า
              </label>

              {createError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm">
                  <BsExclamationTriangle size={14} className="shrink-0" />
                  {createError}
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-[#94A3B8] hover:text-white border border-[rgba(139,92,246,0.2)] transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={creating || !form.userId || !form.ref.trim() || !form.serviceName.trim()}
                  className="flex-1 btn-primary py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                  {creating ? 'กำลังสร้าง...' : 'สร้างออเดอร์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

