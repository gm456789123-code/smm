import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromToken } from '@/lib/auth';

export default async function AdminGuard({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const token = store.get('auth_token')?.value;
  const user = await getUserFromToken(token);
  if (user?.role !== 'admin') redirect('/dashboard');
  return <>{children}</>;
}