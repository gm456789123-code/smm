'use client';

import { useState } from 'react';

const STATS = [
  { label: 'Balance', value: '$0.00', sub: 'USD', color: 'cyan' },
  { label: 'Total Orders', value: '0', sub: 'all time', color: 'indigo' },
  { label: 'Active', value: '0', sub: 'in progress', color: 'violet' },
  { label: 'Completed', value: '0', sub: 'finished', color: 'emerald' },
];

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Twitter/X', 'Telegram'];

const colorMap: Record<string, { value: string; sub: string; glow: string }> = {
  cyan:    { value: 'text-[#06B6D4]', sub: 'text-[#164e63]', glow: 'text-glow-cyan' },
  indigo:  { value: 'text-[#8B5CF6]', sub: 'text-[#2e1065]', glow: 'text-glow-indigo' },
  violet:  { value: 'text-[#a78bfa]', sub: 'text-[#2e1065]', glow: '' },
  emerald: { value: 'text-emerald-400', sub: 'text-emerald-900', glow: '' },
};

export default function DashboardPage() {
  const [activePlatform, setActivePlatform] = useState('Instagram');

  return (
    <main className="flex-1 p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[#475569] text-sm mt-0.5">ยินดีต้อนรับกลับ</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value, sub, color }) => {
          const c = colorMap[color];
          return (
            <div key={label} className="glass p-5">
              <p className="text-[10px] text-[#475569] uppercase tracking-widest">{label}</p>
              <p className={`font-[family-name:var(--font-inter)] text-2xl font-bold mt-1.5 ${c.value} ${c.glow}`}>{value}</p>
              <p className={`text-xs mt-0.5 ${c.sub}`}>{sub}</p>
            </div>
          );
        })}
      </div>

      <div className="glass p-6 space-y-4">
        <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white text-base">Quick Order</h2>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={['glass-tab px-4 py-2 text-sm font-medium', activePlatform === p ? 'glass-tab-active' : 'text-[#94A3B8]'].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">Service</label>
            <select className="glass px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none rounded-xl">
              <option value="" className="bg-[#0D1221]">Select service...</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">Link</label>
            <input type="url" placeholder="https://" className="glass px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] rounded-xl" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-[#475569] uppercase tracking-wider">Quantity</label>
            <input type="number" placeholder="1000" className="glass px-3 py-2.5 text-sm text-[#F1F5F9] bg-transparent outline-none placeholder-[#475569] rounded-xl" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-sm text-[#475569]">Price: <span className="text-[#06B6D4] font-semibold">$0.00</span></p>
          <button className="glass-tab glass-tab-active px-6 py-2.5 text-sm font-semibold text-[#c4b5fd] hover:text-white transition-colors">Place Order</button>
        </div>
      </div>

      <div className="glass p-6 space-y-3">
        <h2 className="font-[family-name:var(--font-jakarta)] font-semibold text-white text-base">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-[#475569] uppercase tracking-widest border-b border-[rgba(139,92,246,0.10)]">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Service</th>
                <th className="pb-3 pr-4">Link</th>
                <th className="pb-3 pr-4">Qty</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Charge</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#475569] text-sm">ยังไม่มีออเดอร์</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
