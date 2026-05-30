import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} username={user.username} />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {children}
      </div>
    </div>
  );
}
