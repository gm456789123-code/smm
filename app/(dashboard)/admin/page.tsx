import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import Link from 'next/link';

async function getStats() {
  try {
    const [[users], [topupRevenue], [pendingTopups], [failedOrders], [orderRevenue]] = await Promise.all([
      db.query<RowDataPacket[]>('SELECT COUNT(*) as total, SUM(email_verified=1) as verified FROM users'),
      db.query<RowDataPacket[]>('SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM transactions WHERE tx_type="topup" AND tx_status="completed"'),
      db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM transactions WHERE tx_type="topup" AND tx_status="pending"'),
      db.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM transactions WHERE api_failed=1'),
      db.query<RowDataPacket[]>('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE tx_type="order" AND tx_status NOT IN ("failed","cancelled")'),
    ]);
    return {
      users: users[0],
      topupRevenue: topupRevenue[0],
      pendingTopups: pendingTopups[0],
      failedOrders: failedOrders[0],
      orderRevenue: orderRevenue[0],
    };
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

async function getRecentTopups() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT t.id, u.username, t.amount, t.tx_status, t.created_at
       FROM transactions t JOIN users u ON u.id = t.user_id
       WHERE t.tx_type = 'topup'
       ORDER BY t.created_at DESC LIMIT 6`
    );
    return rows;
  } catch { return []; }
}

export default async function AdminDashboardPage() {
  const [stats, users, topups] = await Promise.all([getStats(), getRecentUsers(), getRecentTopups()]);

  const statCards = [
    { label: 'ผู้ใช้ทั้งหมด',      value: stats?.users?.total ?? 0,                                              color: 'text-[#8B5CF6]' },
    { label: 'ยืนยัน Email',        value: stats?.users?.verified ?? 0,                                           color: 'text-[#06B6D4]' },
    { label: 'รายได้รวม (เติมเงิน)', value: `฿${Number(stats?.topupRevenue?.total ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'text-emerald-400' },
    { label: 'ยอดออเดอร์รวม',        value: `฿${Number(stats?.orderRevenue?.total ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'text-violet-400' },
    { label: 'รอเติมเงิน',           value: stats?.pendingTopups?.count ?? 0,                                     color: 'text-amber-400' },
    { label: 'ออเดอร์ API ผิดพลาด',  value: stats?.failedOrders?.count ?? 0,                                      color: 'text-rose-400' },
  ];

  return (
    <main className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-[#94A3B8] text-sm mt-0.5">ภาพรวมระบบ</p>
        </div>
        <span className="glass-tab px-3 py-1.5 text-xs text-yellow-400 border-[rgba(251,191,36,0.3)] bg-[rgba(251,191,36,0.08)]">
          👑 Admin Mode
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="glass p-4">
            <p className="text-[9px] text-[#475569] uppercase tracking-widest leading-tight">{s.label}</p>
            <p className={`font-[family-name:var(--font-inter)] text-xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Alert banners */}
      {(Number(stats?.pendingTopups?.count) > 0 || Number(stats?.failedOrders?.count) > 0) && (
        <div className="flex flex-wrap gap-3">
          {Number(stats?.pendingTopups?.count) > 0 && (
            <Link href="/admin/topups"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-300 border border-amber-500/30 bg-amber-500/08 hover:bg-amber-500/15 transition-all">
              ⏳ มีการเติมเงิน {stats?.pendingTopups?.count} รายการรอดำเนินการ →
            </Link>
          )}
          {Number(stats?.failedOrders?.count) > 0 && (
            <Link href="/admin/orders"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-300 border border-rose-500/30 bg-rose-500/08 hover:bg-rose-500/15 transition-all">
              ⚠️ ออเดอร์ API ผิดพลาด {stats?.failedOrders?.count} รายการ →
            </Link>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/users',    label: 'จัดการผู้ใช้',      icon: '👥' },
          { href: '/admin/topups',   label: 'ประวัติเติมเงิน',   icon: '💳' },
          { href: '/admin/orders',   label: 'จัดการออเดอร์',     icon: '📦' },
          { href: '/admin/tickets',  label: 'Support Tickets',   icon: '🎫' },
          { href: '/admin/angpao',   label: 'ซองอั้งเปา',        icon: '🧧' },
          { href: '/admin/blog',     label: 'จัดการบทความ',      icon: '📝' },
          { href: '/admin/settings', label: 'ตั้งค่าเว็บ',       icon: '⚙️' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="glass-tab p-4 text-center space-y-2 hover:border-[rgba(251,191,36,0.3)] hover:bg-[rgba(251,191,36,0.04)] transition-colors">
            <div className="text-2xl">{item.icon}</div>
            <p className="text-xs font-semibold text-[#F1F5F9]">{item.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white">ผู้ใช้ล่าสุด</h2>
            <Link href="/admin/users" className="text-xs text-[#8B5CF6] hover:text-[#a78bfa]">ดูทั้งหมด →</Link>
          </div>
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="py-4 text-center text-[#475569] text-sm">ยังไม่มีผู้ใช้</p>
            ) : users.map((u: RowDataPacket) => (
              <div key={u.id} className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {String(u.username)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F1F5F9] truncate">{u.username}</p>
                  <p className="text-xs text-[#475569] truncate">{u.email}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${u.email_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {u.email_verified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent topups */}
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white">เติมเงินล่าสุด</h2>
            <Link href="/admin/topups" className="text-xs text-[#8B5CF6] hover:text-[#a78bfa]">ดูทั้งหมด →</Link>
          </div>
          <div className="space-y-2">
            {topups.length === 0 ? (
              <p className="py-4 text-center text-[#475569] text-sm">ยังไม่มีรายการเติมเงิน</p>
            ) : topups.map((t: RowDataPacket) => (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F1F5F9]">{t.username}</p>
                  <p className="text-xs text-[#475569]">
                    {new Date(t.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold font-mono text-emerald-400">฿{Number(t.amount).toFixed(2)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    t.tx_status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' :
                    t.tx_status === 'pending'   ? 'text-amber-400 bg-amber-500/10' :
                    'text-rose-400 bg-rose-500/10'
                  }`}>{t.tx_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
