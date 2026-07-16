import { Suspense } from 'react';
import type { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Register | AURA SMM',
  description: 'Create an AURA SMM account to place orders, top up balance, and manage your services.',
  alternates: { canonical: `${SITE_URL}/register` },
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
