'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  id: number; username: string; email: string;
  phone: string; balance: string; referral_code: string;
  role: string; created_at: string;
}

export default function ProfilePage() {
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [phone, setPhone]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk]       = useState(false);

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then((d: UserProfile) => {
      setUser(d); setPhone(d.phone ?? '');
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    await fetch('/api/user/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function changePassword() {
    setPwError(''); setPwOk(false);
    if (pwForm.newPw !== pwForm.confirm) { setPwError('รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    if (pwForm.newPw.length < 6) { setPwError('รหัสผ่านต้องอย่างน้อย 6 ตัว'); return; }
    const res = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
    });
    const d = await res.json();
    if (!res.ok) { setPwError(d.error); return; }
    setPwOk(true);
    setPwForm({ current: '', newPw: '', confirm: '' });
  }

  if (!user) return <main className="flex-1 p-6"><p className="text-[#475569] animate-pulse">กำลังโหลด...</p></main>;

  return (
    <main className="flex-1 p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">โปรไฟล์</h1>
        <p className="text-[#475569] text-sm mt-0.5">จัดการข้อมูลส่วนตัว</p>
      </div>

      {/* Avatar + info */}
      <div className="glass p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(139,92,246,0.2)] flex items-center justify-center text-2xl font-bold text-[#a78bfa]">
          {user.username[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-[family-name:var(--font-jakarta)] text-lg font-bold text-white">{user.username}</p>
          <p className="text-[#94A3B8] text-sm">{user.email}</p>
          <div className="flex gap-2 mt-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.1)] text-[#a78bfa]">{user.role}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(6,182,212,0.1)] text-[#06B6D4]">฿{Number(user.balance).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Referral code */}
      <div className="glass p-5 space-y-2">
        <p className="text-xs text-[#475569] uppercase tracking-wider">Referral Code ของคุณ</p>
        <div className="flex items-center gap-3">
          <code className="font-mono text-[#8B5CF6] text-lg font-bold tracking-widest">{user.referral_code}</code>
          <button
            onClick={() => navigator.clipboard.writeText(user.referral_code)}
            className="glass-tab px-3 py-1.5 text-xs text-[#94A3B8] hover:text-white">
            คัดลอก
          </button>
        </div>
        <p className="text-xs text-[#475569]">สมัครเมื่อ: {new Date(user.created_at).toLocaleDateString('th-TH', { year:'numeric',month:'long',day:'numeric' })}</p>
      </div>

      {/* Edit profile */}
      <div className="glass p-6 space-y-4">
        <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white">แก้ไขข้อมูล</h2>
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Username</label>
          <input value={user.username} disabled className="glass w-full px-3 py-2.5 text-sm text-[#475569] bg-transparent outline-none opacity-60 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Email</label>
          <input value={user.email} disabled className="glass w-full px-3 py-2.5 text-sm text-[#475569] bg-transparent outline-none opacity-60 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">เบอร์โทร</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08x-xxx-xxxx"
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
        </div>
        <button onClick={saveProfile} disabled={saving}
          className="glass-tab glass-tab-active w-full py-2.5 text-sm font-semibold text-[#c4b5fd] hover:text-white disabled:opacity-50">
          {saved ? '✅ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      {/* Change password */}
      <div className="glass p-6 space-y-4">
        <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white">เปลี่ยนรหัสผ่าน</h2>
        {['current','newPw','confirm'].map((field) => (
          <div key={field} className="space-y-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">
              {field === 'current' ? 'รหัสผ่านปัจจุบัน' : field === 'newPw' ? 'รหัสผ่านใหม่' : 'ยืนยันรหัสผ่านใหม่'}
            </label>
            <input type="password" value={pwForm[field as keyof typeof pwForm]}
              onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
              className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
          </div>
        ))}
        {pwError && <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] px-3 py-2 rounded-xl">{pwError}</p>}
        {pwOk    && <p className="text-sm text-emerald-400 bg-[rgba(52,211,153,0.08)] px-3 py-2 rounded-xl">✅ เปลี่ยนรหัสผ่านแล้ว</p>}
        <button onClick={changePassword}
          className="glass-tab glass-tab-active w-full py-2.5 text-sm font-semibold text-[#c4b5fd] hover:text-white">
          เปลี่ยนรหัสผ่าน
        </button>
      </div>
    </main>
  );
}
