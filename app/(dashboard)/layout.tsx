import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromToken } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = await getUserFromToken(token);

  if (!user) redirect('/login');

  return (
    <div className="dash-bg flex min-h-screen items-start">
      <Sidebar role={user.role} username={user.username} />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
