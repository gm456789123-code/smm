'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BsChevronLeft, BsCheckCircle, BsExclamationTriangle, BsPersonCircle,
} from 'react-icons/bs';

interface SimpleUser { id: number; username: string; email: string | null; balance: number; }

export default function CreateManualOrderPage() {
  const [users, setUsers]     = useState<SimpleUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    userQuery: '', userId: 0,
    serviceName: '', link: '', qty: '', amount: '',
    txStatus: 'pending', deductBalance: false,
  });

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const userMatches = useMemo(() => {
    const q = form.userQuery.toLowerCase().trim();
    if (!q) return [];
    return users.filter(u => u.username.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)).slice(0, 8);
  }, [users, form.userQuery]);

  const selectedUser = users.find(u => u.id === form.userId);

  function resetForm() {
    setForm({ userQuery: '', userId: 0, serviceName: '', link: '', qty: '', amount: '', txStatus: 'pending', deductBalance: false });
    setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.serviceName.trim()) return;
    setCreating(true);
    setError('');
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId: form.userId,
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
        setError(data.error ?? 'สร้างออเดอร์ไม่สำเร็จ');
      } else {
        setSuccess(`สร้างออเดอร์ให้ ${data.username} สำเร็จ`);
        resetForm();
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="flex-1 p-4 lg:p-6 max-w-2xl mx-auto w-full space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-[#94A3B8] hover:text-white transition-colors p-1.5 -ml-1.5">
          <BsChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">
            สร้างออเดอร์ให้ user
          </h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">
            สำหรับออเดอร์ที่จัดการเองแบบแมนนวลทั้งหมด ไม่อิงกับ SMM Provider API — กรอกและอัปเดตสถานะเองทุกขั้นตอน
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
          <BsCheckCircle size={16} className="shrink-0" />
          <span className="flex-1">{success}</span>
          <Link href="/admin/orders" className="underline hover:text-emerald-300 shrink-0">ดูรายการออเดอร์</Link>
        </div>
      )}

      <form onSubmit={submit} className="glass p-6 space-y-4">
        {/* User picker */}
        <div className="space-y-1.5 relative">
          <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ผู้ใช้ *</label>
          {form.userId ? (
            <div className="flex items-center justify-between glass px-3.5 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2.5">
                <BsPersonCircle size={18} className="text-emerald-400" />
                <div>
                  <p className="text-sm text-white font-medium">{selectedUser?.username}</p>
                  {selectedUser?.email && <p className="text-[11px] text-[#94A3B8]">{selectedUser.email}</p>}
                </div>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, userId: 0, userQuery: '' }))}
                className="text-[#94A3B8] hover:text-white text-xs">เปลี่ยน</button>
            </div>
          ) : (
            <>
              <input
                type="text" value={form.userQuery}
                onChange={e => setForm(f => ({ ...f, userQuery: e.target.value }))}
                placeholder="พิมพ์ username หรือ email เพื่อค้นหา..."
                autoFocus
                className="w-full glass px-3.5 py-3 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
              />
              {userMatches.length > 0 && (
                <div className="absolute z-10 w-full mt-1 glass rounded-xl border border-[rgba(139,92,246,0.25)] overflow-hidden max-h-56 overflow-y-auto">
                  {userMatches.map(u => (
                    <button key={u.id} type="button"
                      onClick={() => setForm(f => ({ ...f, userId: u.id, userQuery: '' }))}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-[#CBD5E1] hover:bg-[rgba(139,92,246,0.12)] transition-colors flex items-center justify-between"
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

        <div className="space-y-1.5">
          <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ชื่อบริการ *</label>
          <input
            type="text" value={form.serviceName}
            onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
            placeholder="เช่น Instagram Followers 1000"
            className="w-full glass px-3.5 py-3 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ลิงก์เป้าหมาย</label>
          <input
            type="text" value={form.link}
            onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            placeholder="https://..."
            className="w-full glass px-3.5 py-3 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">จำนวน</label>
            <input
              type="number" value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
              placeholder="1000"
              className="w-full glass px-3.5 py-3 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">ยอดเงิน (฿)</label>
            <input
              type="number" step="0.01" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              className="w-full glass px-3.5 py-3 text-sm text-white bg-transparent outline-none placeholder-[#475569] rounded-xl border border-[rgba(139,92,246,0.2)] focus:border-[rgba(139,92,246,0.5)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#94A3B8] uppercase tracking-widest font-semibold">สถานะเริ่มต้น</label>
            <select
              value={form.txStatus}
              onChange={e => setForm(f => ({ ...f, txStatus: e.target.value }))}
              className="w-full glass px-3.5 py-3 text-sm text-white bg-[rgba(13,18,34,0.9)] outline-none rounded-xl border border-[rgba(139,92,246,0.2)]"
            >
              <option value="pending" className="bg-[#0d1222]">pending</option>
              <option value="in_progress" className="bg-[#0d1222]">in_progress</option>
              <option value="partial" className="bg-[#0d1222]">partial</option>
              <option value="completed" className="bg-[#0d1222]">completed</option>
              <option value="cancelled" className="bg-[#0d1222]">cancelled</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-[#CBD5E1] cursor-pointer pt-1">
          <input
            type="checkbox" checked={form.deductBalance}
            onChange={e => setForm(f => ({ ...f, deductBalance: e.target.checked }))}
            className="w-4 h-4 rounded accent-[#8B5CF6]"
          />
          หักยอดเงิน ฿{form.amount || 0} จากบัญชีลูกค้า
        </label>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm">
            <BsExclamationTriangle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2.5 pt-1">
          <Link href="/admin/orders"
            className="flex-1 py-3 text-sm font-semibold rounded-xl text-[#94A3B8] hover:text-white border border-[rgba(139,92,246,0.2)] transition-colors text-center">
            ยกเลิก
          </Link>
          <button type="submit" disabled={creating || !form.userId || !form.serviceName.trim()}
            className="flex-1 btn-primary py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            {creating ? 'กำลังสร้าง...' : 'สร้างออเดอร์'}
          </button>
        </div>
      </form>
    </main>
  );
}
