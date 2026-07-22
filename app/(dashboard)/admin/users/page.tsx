'use client';

import { useEffect, useState, useCallback } from 'react';
import { BsArrowClockwise, BsPlusCircle, BsDashCircle } from 'react-icons/bs';

interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  email_verified: number;
  role: string;
  balance: number;
  created_at: string;
}

interface AdjustModal {
  user: User;
  mode: 'add' | 'deduct';
}

export default function AdminUsersPage() {
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState<AdjustModal | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote]     = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openModal(user: User, mode: 'add' | 'deduct') {
    setModal({ user, mode });
    setAmount('');
    setNote('');
    setMsg(null);
  }

  async function submitAdjust() {
    if (!modal) return;
    const val = parseFloat(amount);
    if (!val || val <= 0) { setMsg({ ok: false, text: 'กรอกจำนวนเงินให้ถูกต้อง' }); return; }
    const delta = modal.mode === 'deduct' ? -val : val;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${modal.user.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: delta, note }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ ok: true, text: 'อัปเดตยอดเงินสำเร็จ' });
        load();
        setTimeout(() => setModal(null), 1000);
      } else {
        setMsg({ ok: false, text: data.error ?? 'เกิดข้อผิดพลาด' });
      }
    } catch {
      setMsg({ ok: false, text: 'เกิดข้อผิดพลาด' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">จัดการผู้ใช้</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">ผู้ใช้ทั้งหมด {users.length} คน</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-[rgba(251,191,36,0.2)] hover:border-[rgba(251,191,36,0.45)] hover:bg-[rgba(251,191,36,0.06)] transition-all">
          <BsArrowClockwise size={14} />
          รีเฟรช
        </button>
      </div>

      <div className="glass p-6">
        {loading ? (
          <p className="py-10 text-center text-[#94A3B8] animate-pulse">กำลังโหลด...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] text-[#94A3B8] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                  <th className="pb-3 pr-4">ID</th>
                  <th className="pb-3 pr-4">Username</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">เบอร์โทร</th>
                  <th className="pb-3 pr-4">ยอดเงิน</th>
                  <th className="pb-3 pr-4">สถานะ</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">สมัครวันที่</th>
                  <th className="pb-3">ปรับยอด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
                {users.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center text-[#94A3B8]">ยังไม่มีผู้ใช้</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                    <td className="py-3 pr-4 text-[#94A3B8] font-mono text-xs">{u.id}</td>
                    <td className="py-3 pr-4 font-semibold text-[#F1F5F9]">{u.username}</td>
                    <td className="py-3 pr-4 text-[#94A3B8] text-xs">{u.email}</td>
                    <td className="py-3 pr-4 text-[#94A3B8] text-xs">{u.phone ?? '—'}</td>
                    <td className="py-3 pr-4 text-[#06B6D4] font-mono text-xs font-bold">฿{Number(u.balance).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.email_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {u.email_verified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa]'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#94A3B8] text-xs">
                      {new Date(u.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openModal(u, 'add')} title="เติมเครดิต"
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          <BsPlusCircle size={14} />
                        </button>
                        <button onClick={() => openModal(u, 'deduct')} title="หักเครดิต"
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <BsDashCircle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Balance adjustment modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass rounded-2xl p-6 w-full max-w-sm space-y-4"
            style={{ border: `1px solid ${modal.mode === 'add' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
            <div>
              <h2 className="text-lg font-bold text-white">
                {modal.mode === 'add' ? '+ เติมเครดิต' : '− หักเครดิต'}
              </h2>
              <p className="text-sm text-[#94A3B8] mt-0.5">
                {modal.user.username} · ยอดปัจจุบัน <span className="text-[#06B6D4] font-mono">฿{Number(modal.user.balance).toFixed(2)}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">จำนวนเงิน (฿)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full glass px-3 py-2.5 rounded-xl text-white text-sm border border-[rgba(139,92,246,0.2)] bg-transparent focus:border-[rgba(139,92,246,0.5)] outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1.5">หมายเหตุ (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="เช่น เติมแทนลูกค้า, คืนเงิน"
                  className="w-full glass px-3 py-2.5 rounded-xl text-white text-sm border border-[rgba(139,92,246,0.2)] bg-transparent focus:border-[rgba(139,92,246,0.5)] outline-none"
                />
              </div>
            </div>

            {msg && (
              <p className={`text-sm font-medium ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={submitAdjust}
                disabled={saving}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                  modal.mode === 'add'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                }`}
              >
                {saving ? 'กำลังบันทึก...' : modal.mode === 'add' ? 'ยืนยันเติมเครดิต' : 'ยืนยันหักเครดิต'}
              </button>
              <button onClick={() => setModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-[rgba(255,255,255,0.07)] transition-all">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
