'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FormData {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    username: '', email: '', phone: '',
    password: '', confirmPassword: '', referralCode: '',
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [otpStep, setOtpStep]   = useState(false);
  const [otpRef, setOtpRef]     = useState('');
  const [otpCode, setOtpCode]   = useState('');
  const [otpDone, setOtpDone]   = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          referralCode: form.referralCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      if (data.requireOtp) {
        setOtpRef(data.ref ?? '');
        setOtpStep(true);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode, ref: otpRef }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setOtpDone(true);
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 1500);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  if (otpDone) {
    return (
      <div className="glass w-full max-w-md p-8 text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">ยืนยันสำเร็จ!</h2>
        <p className="text-[#94A3B8] text-sm">กำลังพาเข้าสู่ Dashboard...</p>
      </div>
    );
  }

  if (otpStep) {
    return (
      <div className="glass w-full max-w-sm p-8 space-y-6">
        <div>
          <p className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold">
            <span className="text-[#8B5CF6] text-glow-indigo">AURA</span>
            <span className="text-white"> SMM</span>
          </p>
          <h1 className="text-white font-[family-name:var(--font-jakarta)] text-lg font-bold mt-1">ยืนยันเบอร์โทร</h1>
          <p className="text-[#475569] text-sm mt-0.5">กรอกรหัส OTP ที่ส่งไปยัง <span className="text-[#F1F5F9]">{form.phone}</span></p>
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">รหัส OTP (6 หลัก)</label>
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))}
              placeholder="000000" autoFocus
              className="glass w-full px-3 py-3 text-center text-2xl font-mono font-bold text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] tracking-[0.5em] focus:border-[rgba(139,92,246,0.45)] transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] px-3 py-2 rounded-xl">{error}</p>}
          <button type="submit" disabled={loading || otpCode.length < 6}
            className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white disabled:opacity-50">
            {loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
          </button>
        </form>
      </div>
    );
  }

  if (success) {
    return (
      <div className="glass w-full max-w-md p-8 text-center space-y-4">
        <div className="text-5xl">📧</div>
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">
          ตรวจสอบ Email ของคุณ
        </h2>
        <p className="text-[#94A3B8] text-sm leading-relaxed">
          เราส่งลิงก์ยืนยันไปที่ <strong className="text-[#F1F5F9]">{form.email}</strong> แล้ว<br />
          กรุณาตรวจสอบ inbox (หรือ spam) และคลิกลิงก์ยืนยัน
        </p>
        <Link href="/login" className="glass-tab glass-tab-active block px-6 py-2.5 text-sm font-semibold text-[#c4b5fd] mt-2">
          ไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="glass w-full max-w-md p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold">
          <span className="text-[#8B5CF6] text-glow-indigo">AURA</span>
          <span className="text-white"> SMM</span>
        </p>
        <h1 className="text-white font-[family-name:var(--font-jakarta)] text-lg font-bold mt-1">
          สมัครสมาชิก
        </h1>
        <p className="text-[#475569] text-sm mt-0.5">
          มีบัญชีแล้ว?{' '}
          <Link href="/login" className="text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Username *</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="your_username"
            required
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">
            เบอร์โทร <span className="text-[#334155] normal-case">(ไม่บังคับ)</span>
          </label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="08x-xxx-xxxx"
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
          />
        </div>

        {/* Password */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">รหัสผ่าน *</label>
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
          <div className="space-y-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">ยืนยัน *</label>
            <input
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••"
              required
              className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
            />
          </div>
        </div>

        {/* Referral */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">
            Referral Code <span className="text-[#334155] normal-case">(ไม่บังคับ)</span>
          </label>
          <input
            name="referralCode"
            value={form.referralCode}
            onChange={handleChange}
            placeholder="XXXX0000"
            className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="glass border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 py-2.5 text-sm text-red-400 rounded-xl">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        >
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
      </form>
    </div>
  );
}
