import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function getUsers() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, username, email, phone, email_verified, role, balance, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  } catch { return []; }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">จัดการผู้ใช้</h1>
        <p className="text-[#475569] text-sm mt-0.5">ผู้ใช้ทั้งหมด {users.length} คน</p>
      </div>

      <div className="glass p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Username</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">เบอร์โทร</th>
                <th className="pb-3 pr-4">ยอดเงิน</th>
                <th className="pb-3 pr-4">สถานะ</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3">สมัครวันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
              {users.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-[#475569]">ยังไม่มีผู้ใช้</td></tr>
              ) : users.map((u: RowDataPacket) => (
                <tr key={u.id} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                  <td className="py-3 pr-4 text-[#475569] font-mono text-xs">{u.id}</td>
                  <td className="py-3 pr-4 font-semibold text-[#F1F5F9]">{u.username}</td>
                  <td className="py-3 pr-4 text-[#94A3B8] text-xs">{u.email}</td>
                  <td className="py-3 pr-4 text-[#94A3B8] text-xs">{u.phone ?? '—'}</td>
                  <td className="py-3 pr-4 text-[#06B6D4] font-mono text-xs">฿{Number(u.balance).toFixed(2)}</td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.email_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {u.email_verified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-[rgba(139,92,246,0.1)] text-[#a78bfa]'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-[#475569] text-xs">
                    {new Date(u.created_at).toLocaleDateString('th-TH')}
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
