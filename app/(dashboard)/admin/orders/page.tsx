import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function getAllOrders() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT t.*, u.username FROM transactions t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC LIMIT 200`
    );
    return rows;
  } catch { return []; }
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400',
  pending:   'bg-amber-500/10 text-amber-400',
  failed:    'bg-red-500/10 text-red-400',
};

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  const total  = orders.reduce((a, o) => a + (o.tx_type === 'topup' && o.tx_status === 'completed' ? Number(o.amount) : 0), 0);

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">จัดการออเดอร์</h1>
        <p className="text-[#475569] text-sm mt-0.5">{orders.length} รายการ · รายได้รวม ฿{total.toLocaleString()}</p>
      </div>

      <div className="glass p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">ประเภท</th>
                <th className="pb-3 pr-4">จำนวน</th>
                <th className="pb-3 pr-4">Ref</th>
                <th className="pb-3 pr-4">สถานะ</th>
                <th className="pb-3">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(139,92,246,0.05)]">
              {orders.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-[#475569]">ยังไม่มีออเดอร์</td></tr>
              ) : orders.map((o: RowDataPacket) => (
                <tr key={o.id} className="hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                  <td className="py-2.5 pr-4 font-mono text-xs text-[#475569]">{o.id}</td>
                  <td className="py-2.5 pr-4 text-[#a78bfa] font-medium">{o.username}</td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(139,92,246,0.1)] text-[#a78bfa]">{o.tx_type}</span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono font-semibold text-[#06B6D4]">฿{Number(o.amount).toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#475569] max-w-[160px] truncate">{o.ref ?? '—'}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLE[o.tx_status] ?? ''}`}>{o.tx_status}</span>
                  </td>
                  <td className="py-2.5 text-xs text-[#475569]">{new Date(o.created_at).toLocaleDateString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
