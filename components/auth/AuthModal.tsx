'use client';

import { useEffect } from 'react';
import { BsX } from 'react-icons/bs';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
  open: boolean;
  view: 'login' | 'register';
  onChangeView: (view: 'login' | 'register') => void;
  onClose: () => void;
}

export default function AuthModal({ open, view, onChangeView, onClose }: AuthModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="close modal"
        className="absolute inset-0 bg-[rgba(2,6,23,0.75)] backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[91] w-full max-w-md">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-[rgba(15,23,42,0.95)] border border-[rgba(139,92,246,0.35)] text-[#cbd5e1] hover:text-white flex items-center justify-center"
        >
          <BsX size={18} />
        </button>
        {view === 'login' ? (
          <LoginForm inModal onSwitchToRegister={() => onChangeView('register')} onSuccess={onClose} />
        ) : (
          <RegisterForm inModal onSwitchToLogin={() => onChangeView('login')} onSuccess={onClose} />
        )}
      </div>
    </div>
  );
}
