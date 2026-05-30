'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ login: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/');
      router.refresh();
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass w-full max-w-sm p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold">
          <span className="text-[#8B5CF6] text-glow-indigo">AURA</span>
          <span className="text-white"> SMM</span>
        </p>
        <h1 className="text-white font-[family-name:var(--font-jakarta)] text-lg font-bold mt-1">
          เข้าสู่ระบบ
        </h1>
        <p className="text-[#475569] text-sm mt-0.5">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">
            สมัครสมาชิก
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Username หรือ Email</label>
          <input
            name="login"
            value={form.login}
            onChange={handleChange}
            placeholder="username หรือ email"
            required
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#475569] uppercase tracking-wider">รหัสผ่าน</label>
            <Link href="/forgot-password" className="text-xs text-[#475569] hover:text-[#8B5CF6] transition-colors">
              ลืมรหัสผ่าน?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••"
            required
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
          />
        </div>

        {error && (
          <div className="glass border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 py-2.5 text-sm text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
