'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BsX } from 'react-icons/bs';

interface LoginFormProps {
  inModal?: boolean;
  onSwitchToRegister?: () => void;
  onSuccess?: () => void;
}

function getAuthErrorMessage(urlError: string | null) {
  if (!urlError) return '';
  if (urlError === 'GoogleAuthFailed') return 'การยืนยันตัวตนกับ Google ล้มเหลว';
  if (urlError === 'GoogleTokenError') return 'ไม่สามารถขอรับข้อมูลจาก Google ได้';
  if (urlError === 'NoEmailProvided') return 'บัญชี Google นี้ไม่มีอีเมลให้ระบบใช้งาน';
  if (urlError === 'InternalServerError') return 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่';
  return `เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ${urlError}`;
}

export default function LoginForm({ inModal = false, onSwitchToRegister, onSuccess }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ login: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const displayError = error || getAuthErrorMessage(searchParams.get('error'));

  useEffect(() => {
    // Reload when restoring from back-forward cache so auth UI stays in sync.
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
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push('/dashboard');
      router.refresh();
      if (inModal) onSuccess?.();
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass relative w-full max-w-sm p-8 space-y-6">
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
        <h1 className="text-white font-[family-name:var(--font-jakarta)] text-lg font-bold mt-1">เข้าสู่ระบบ</h1>
        <p className="text-[#475569] text-sm mt-0.5">
          ยังไม่มีบัญชี?{' '}
          {inModal ? (
            <button type="button" onClick={onSwitchToRegister} className="text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">
              สมัครสมาชิก
            </button>
          ) : (
            <Link href="/register" className="text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">
              สมัครสมาชิก
            </Link>
          )}
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

        {displayError && (
          <div className="glass border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.08)] px-3 py-2.5 text-sm text-red-400 rounded-xl">
            {displayError}
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
        เข้าสู่ระบบด้วย Google
      </a>
    </div>
  );
}
