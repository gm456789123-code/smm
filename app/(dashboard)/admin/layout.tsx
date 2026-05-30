import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';

export default async function AdminGuard({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const token = store.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  if (user?.role !== 'admin') redirect('/dashboard');
  return <>{children}</>;
}
