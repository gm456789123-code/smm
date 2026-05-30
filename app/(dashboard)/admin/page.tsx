import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import Link from 'next/link';

async function getStats() {
  try {
    const [[users], [orders], [revenue]] = await Promise.all([
      db.query<RowDataPacket[]>('SELECT COUNT(*) as total, SUM(email_verified=1) as verified FROM users'),
      db.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM transactions WHERE tx_type="topup"'),
      db.query<RowDataPacket[]>('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE tx_type="topup" AND tx_status="completed"'),
    ]);
    return { users: users[0], orders: orders[0], revenue: revenue[0] };
  } catch { return null; }
}

async function getRecentUsers() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, email_verified, role, created_at FROM users ORDER BY created_at DESC LIMIT 8'
    );
    return rows;
  } catch { return []; }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const users = await getRecentUsers();

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-[#475569] text-sm mt-0.5">ภาพรวมระบบ</p>
        </div>
        <span className="glass-tab px-3 py-1.5 text-xs text-yellow-400 border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)]">
          👑 Admin Mode
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ผู้ใช้ทั้งหมด',  value: stats?.users?.total ?? 0,    color: 'text-[#8B5CF6]' },
          { label: 'ยืนยัน Email',    value: stats?.users?.verified ?? 0, color: 'text-[#06B6D4]' },
          { label: 'ธุรกรรม',         value: stats?.orders?.total ?? 0,   color: 'text-violet-400' },
          { label: 'รายได้รวม (฿)',   value: Number(stats?.revenue?.total ?? 0).toLocaleString(), color: 'text-emerald-400' },
        ].map((s) => (
          <div key={s.label} className="glass p-5">
            <p className="text-[10px] text-[#475569] uppercase tracking-widest">{s.label}</p>
            <p className={`font-[family-name:var(--font-inter)] text-2xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/users',    label: 'จัดการผู้ใช้',    icon: '👥' },
          { href: '/admin/orders',   label: 'จัดการออเดอร์',   icon: '📦' },
          { href: '/admin/blog',     label: 'จัดการบทความ',    icon: '📝' },
          { href: '/admin/settings', label: 'ตั้งค่าเว็บ',     icon: '⚙️' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="glass-tab p-4 text-center space-y-2 hover:border-[rgba(251,191,36,0.3)] transition-colors">
            <div className="text-2xl">{item.icon}</div>
            <p className="text-xs font-semibold text-[#F1F5F9]">{item.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent users */}
      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white">ผู้ใช้ล่าสุด</h2>
          <Link href="/admin/users" className="text-xs text-[#8B5CF6] hover:text-[#a78bfa]">ดูทั้งหมด →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                <th className="pb-3 pr-4">Username</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">สถานะ</th>
                <th className="pb-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[#475569]">ยังไม่มีผู้ใช้</td></tr>
              ) : users.map((u: RowDataPacket) => (
                <tr key={u.id}>
                  <td className="py-3 pr-4 font-medium text-[#F1F5F9]">{u.username}</td>
                  <td className="py-3 pr-4 text-[#94A3B8] text-xs">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.email_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {u.email_verified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa]'}`}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
