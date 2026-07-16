import { Suspense } from 'react';
import type { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Login | AURA SMM',
  description: 'Sign in to your AURA SMM account to manage orders, balance, and services.',
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
