'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BsX, BsCheckCircleFill, BsCircle } from 'react-icons/bs';

function getPasswordStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper:  /[A-Z]/.test(pw),
    lower:  /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed };
}

interface FormData {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

interface RegisterFormProps {
  inModal?: boolean;
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

export default function RegisterForm({ inModal = false, onSwitchToLogin, onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    username: '', email: '', phone: '',
    password: '', confirmPassword: '', referralCode: '',
  });
  const [hp, setHp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpRef, setOtpRef] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpDone, setOtpDone] = useState(false);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleOtpChange(index: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const nextOtp = [...otpCode];
    nextOtp[index] = val;
    setOtpCode(nextOtp);
    if (val && index < 5) otpInputs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { checks } = getPasswordStrength(form.password);
    if (!checks.length) { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (!checks.upper)  { setError('รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว'); return; }
    if (!checks.lower)  { setError('รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว'); return; }
    if (!checks.number) { setError('รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว'); return; }

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
          hp,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
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
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode.join(''), ref: otpRef }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setOtpDone(true);
      setTimeout(() => {
        if (inModal) {
          onSuccess?.();
          router.refresh();
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      }, 1200);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  if (otpDone) {
    return (
      <div className="glass relative w-full max-w-md p-8 text-center space-y-4">
        <div className="text-5xl">OK</div>
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">ยืนยันสำเร็จ!</h2>
        <p className="text-[#94A3B8] text-sm">กำลังพาเข้าสู่ระบบ...</p>
      </div>
    );
  }

  if (otpStep) {
    return (
      <div className="glass relative w-full max-w-sm p-8 space-y-6">
        <button type="button" onClick={onSuccess} className="absolute top-4 right-4 text-[#475569] hover:text-white transition-colors">
          <BsX size={24} />
        </button>
        <div>
          <p className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold">
            <span className="text-[#8B5CF6] text-glow-indigo">AURA</span>
            <span className="text-white"> SMM</span>
          </p>
          <h1 className="text-white font-[family-name:var(--font-jakarta)] text-lg font-bold mt-1">ยืนยันเบอร์โทร</h1>
          <p className="text-[#475569] text-sm mt-0.5">กรอกรหัส OTP ที่ส่งไปยัง <span className="text-[#F1F5F9]">{form.phone}</span></p>
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex justify-between gap-2">
            {otpCode.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { otpInputs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(idx, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(idx, e)}
                className="w-10 h-12 glass text-center text-xl font-mono font-bold text-[#F1F5F9] bg-transparent outline-none border-[rgba(139,92,246,0.2)] rounded-lg focus:border-[rgba(139,92,246,0.45)] transition-colors"
              />
            ))}
          </div>
          {error && <p className="text-sm text-red-400 bg-[rgba(239,68,68,0.08)] px-3 py-2 rounded-xl">{error}</p>}
          <button type="submit" disabled={loading || otpCode.join('').length < 6} className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white disabled:opacity-50">
            {loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน OTP'}
          </button>
        </form>
      </div>
    );
  }

  if (success) {
    return (
      <div className="glass w-full max-w-md p-8 text-center space-y-4">
        <div className="text-5xl">EMAIL</div>
        <h2 className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-white">ตรวจสอบอีเมลของคุณ</h2>
        <p className="text-[#94A3B8] text-sm leading-relaxed">
          เราส่งลิงก์ยืนยันไปที่ <strong className="text-[#F1F5F9]">{form.email}</strong> แล้ว
        </p>
        {inModal ? (
          <button type="button" onClick={onSwitchToLogin} className="glass-tab glass-tab-active block w-full px-6 py-2.5 text-sm font-semibold text-[#c4b5fd] mt-2">
            ไปหน้าเข้าสู่ระบบ
          </button>
        ) : (
          <Link href="/login" className="glass-tab glass-tab-active block px-6 py-2.5 text-sm font-semibold text-[#c4b5fd] mt-2">
            ไปหน้าเข้าสู่ระบบ
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="glass relative w-full max-w-md p-8 space-y-6">
      <Link
        href="/"
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
        aria-label="Back to home"
      >
        <BsX size={20} />
      </Link>
      <div>
        <p className="font-[family-name:var(--font-jakarta)] text-2xl font-extrabold">
          <span className="text-[#8B5CF6] text-glow-indigo">AURA</span>
          <span className="text-white"> SMM</span>
        </p>
        <h1 className="text-white font-[family-name:var(--font-jakarta)] text-lg font-bold mt-1">สมัครสมาชิก</h1>
        <p className="text-[#475569] text-sm mt-0.5">
          มีบัญชีแล้ว?{' '}
          {inModal ? (
            <button type="button" onClick={onSwitchToLogin} className="text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">
              เข้าสู่ระบบ
            </button>
          ) : (
            <Link href="/login" className="text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">
              เข้าสู่ระบบ
            </Link>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Honeypot — hidden from humans, bots fill it */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
          <input tabIndex={-1} autoComplete="off" name="website" value={hp} onChange={e => setHp(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Username *</label>
          <input name="username" value={form.username} onChange={handleChange} placeholder="your_username" required className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Email *</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">เบอร์โทร <span className="text-[#334155] normal-case">(ไม่บังคับ)</span></label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="08x-xxx-xxxx" className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">รหัสผ่าน *</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="อย่างน้อย 8 ตัว" required className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />

          {/* Strength bar */}
          {form.password.length > 0 && (() => {
            const { checks, passed } = getPasswordStrength(form.password);
            const colors = ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#22c55e'];
            const labels = ['', 'อ่อนมาก', 'อ่อน', 'พอใช้', 'แข็งแกร่ง'];
            return (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i < passed ? colors[passed] : 'rgba(255,255,255,0.07)' }} />
                  ))}
                </div>
                <p className="text-[10px] font-semibold" style={{ color: colors[passed] }}>{labels[passed]}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {[
                    { ok: checks.length, label: 'ขั้นต่ำ 8 ตัวอักษร' },
                    { ok: checks.upper,  label: 'ตัวพิมพ์ใหญ่ (A-Z)' },
                    { ok: checks.lower,  label: 'ตัวพิมพ์เล็ก (a-z)' },
                    { ok: checks.number, label: 'ตัวเลข (0-9)' },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-[10px]">
                      {ok
                        ? <BsCheckCircleFill size={10} className="text-emerald-400 shrink-0" />
                        : <BsCircle size={10} className="text-[#334155] shrink-0" />}
                      <span className={ok ? 'text-[#94A3B8]' : 'text-[#475569]'}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">ยืนยันรหัสผ่าน *</label>
          <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" required className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
          {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
            <p className="text-[10px] text-red-400">รหัสผ่านไม่ตรงกัน</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#475569] uppercase tracking-wider">Referral Code <span className="text-[#334155] normal-case">(ไม่บังคับ)</span></label>
          <input name="referralCode" value={form.referralCode} onChange={handleChange} placeholder="XXXX0000" className="glass w-full px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] focus:border-[rgba(139,92,246,0.45)] transition-colors" />
        </div>

        {error && (
          <div className="glass border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 py-2.5 text-sm text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="glass-tab glass-tab-active w-full py-3 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1">
          {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
      </form>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[rgba(139,92,246,0.15)]"></div>
        <span className="flex-shrink-0 mx-4 text-[#475569] text-[10px] uppercase tracking-widest">หรือ</span>
        <div className="flex-grow border-t border-[rgba(139,92,246,0.15)]"></div>
      </div>
      
      <a
        href="/api/auth/google"
        className="glass-tab flex items-center justify-center gap-3 w-full py-2.5 text-sm font-medium text-[#F1F5F9] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        สมัครด้วย Google
      </a>
    </div>
  );
}
