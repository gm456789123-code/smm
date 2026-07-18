'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BsPlus, BsTrash, BsCheckCircle, BsExclamationCircle, BsArrowRight } from 'react-icons/bs';

const EXCHANGE_RATE = Number(process.env.NEXT_PUBLIC_SMM_EXCHANGE_RATE ?? 36);
const MARKUP        = Number(process.env.NEXT_PUBLIC_SMM_MARKUP ?? 1.3);

function calcCostThb(qty: number, rateUsd: number) {
  return Math.ceil((qty / 1000) * rateUsd * EXCHANGE_RATE * MARKUP * 100) / 100;
}

interface Row {
  id: string;
  serviceId: string;
  link: string;
  qty: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  msg: string;
}

type ServiceMap = Record<number, { name: string; rate: string; min: string; max: string; provider: string }>;

let _rowId = 0;
function newRow(): Row {
  return { id: String(++_rowId), serviceId: '', link: '', qty: '', status: 'idle', msg: '' };
}

const inputCls = 'w-full glass px-3 py-2.5 text-sm text-white bg-transparent outline-none rounded-xl border border-[rgba(139,92,246,0.25)] focus:border-[rgba(139,92,246,0.55)] transition-colors placeholder-[#64748b] disabled:opacity-50';
const labelCls = 'block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5';

export default function MassOrderPage() {
  const [rows, setRows]       = useState<Row[]>([newRow(), newRow(), newRow()]);
  const [balance, setBalance] = useState<number | null>(null);
  const [svcMap, setSvcMap]   = useState<ServiceMap>({});
  const [submitting, setSub]  = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/smm/services').then(r => r.json()).catch(() => []),
      fetch('/api/user/me').then(r => r.json()).catch(() => null),
    ]).then(([svcs, user]) => {
      if (Array.isArray(svcs)) {
        const map: ServiceMap = {};
        for (const s of svcs) {
          map[s.service] = { name: s.name, rate: s.rate, min: s.min, max: s.max, provider: s.provider };
        }
        setSvcMap(map);
      }
      if (user && !user.error) setBalance(Number(user.balance));
    });
  }, []);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }

  function addRow() { setRows(prev => [...prev, newRow()]); }

  function removeRow(id: string) {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);
  }

  const activeRows = rows.filter(r => r.serviceId && r.link && r.qty);

  let totalCost = 0;
  for (const r of activeRows) {
    const svc = svcMap[Number(r.serviceId)];
    if (svc) totalCost += calcCostThb(Number(r.qty), Number(svc.rate));
  }

  async function submitAll() {
    if (activeRows.length === 0 || submitting) return;
    setSub(true);

    for (const row of activeRows) {
      updateRow(row.id, { status: 'loading', msg: '' });
      try {
        const svc = svcMap[Number(row.serviceId)];
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: Number(row.serviceId),
            provider: svc?.provider,
            link: row.link,
            quantity: Number(row.qty),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          updateRow(row.id, { status: 'error', msg: data.error ?? 'เกิดข้อผิดพลาด' });
        } else {
          updateRow(row.id, { status: 'success', msg: `Order #${data.orderId} — ฿${data.cost?.toFixed(2)}` });
          if (data.balance !== undefined) setBalance(Number(data.balance));
        }
      } catch {
        updateRow(row.id, { status: 'error', msg: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
      }
    }

    setSub(false);
  }

  return (
    <main className="flex-1 p-4 lg:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-jakarta)] text-2xl font-bold text-white">สั่งจำนวนมาก</h1>
          <p className="text-[#64748b] text-sm mt-0.5">สั่งหลายออเดอร์พร้อมกันในคราวเดียว</p>
        </div>
        <div className="glass px-4 py-2.5 flex items-center gap-3 rounded-xl">
          <div>
            <p className="text-[10px] text-[#64748b] uppercase tracking-widest">ยอดเงิน</p>
            <p className="text-[#06B6D4] font-bold font-[family-name:var(--font-inter)]">
              {balance !== null ? `฿${balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '...'}
            </p>
          </div>
          <Link href="/topup" className="text-sm text-[#8B5CF6] hover:text-[#a78bfa] transition-colors font-medium">
            + เติม
          </Link>
        </div>
      </div>

      {/* Tip */}
      <div className="glass p-4 flex items-start gap-3 text-sm text-[#94A3B8] border border-[rgba(139,92,246,0.15)] rounded-xl">
        <span className="text-[#8B5CF6] mt-0.5 shrink-0">💡</span>
        <p>กรอก Service ID ของบริการที่ต้องการ (หาได้จากหน้า{' '}
          <Link href="/services" className="text-[#8B5CF6] hover:underline">บริการทั้งหมด</Link>{' '}
          หรือ{' '}
          <Link href="/order" className="text-[#8B5CF6] hover:underline">สั่งซื้อ</Link>)
          {' '}ระบบจะส่งออเดอร์ทั้งหมดตามลำดับอัตโนมัติ
        </p>
      </div>

      {/* ── MOBILE: card layout ── */}
      <div className="lg:hidden space-y-3">
        {rows.map((row, idx) => {
          const svcId = Number(row.serviceId);
          const svc   = svcMap[svcId];
          const qty   = Number(row.qty);
          const cost  = svc && qty > 0 ? calcCostThb(qty, Number(svc.rate)) : null;
          const qtyMin = svc ? Number(svc.min) : 0;
          const qtyMax = svc ? Number(svc.max) : Infinity;
          const qtyInvalid = row.qty && svc && (qty < qtyMin || qty > qtyMax);
          const disabled = row.status === 'loading' || row.status === 'success';

          return (
            <div key={row.id} className="glass rounded-xl p-4 space-y-3 border border-[rgba(139,92,246,0.15)]">
              {/* Row header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">ออเดอร์ #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1 || disabled}
                  className="text-[#475569] hover:text-rose-400 transition-colors disabled:opacity-30 p-1"
                  aria-label="ลบแถว"
                >
                  <BsTrash size={14} />
                </button>
              </div>

              {/* Service ID + name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Service ID</label>
                  <input
                    type="number"
                    value={row.serviceId}
                    onChange={e => updateRow(row.id, { serviceId: e.target.value, status: 'idle', msg: '' })}
                    placeholder="เช่น 1234"
                    disabled={disabled}
                    className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                </div>
                <div>
                  <label className={labelCls}>ชื่อบริการ</label>
                  <div className="px-3 py-2.5 rounded-xl border border-[rgba(139,92,246,0.12)] bg-[rgba(255,255,255,0.02)] min-h-[42px]">
                    {svc ? (
                      <p className="text-white text-xs font-medium leading-snug line-clamp-2">{svc.name}</p>
                    ) : row.serviceId ? (
                      <p className="text-rose-400 text-xs">ไม่พบบริการ</p>
                    ) : (
                      <p className="text-[#475569] text-xs">—</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Link */}
              <div>
                <label className={labelCls}>Link / URL</label>
                <input
                  type="url"
                  value={row.link}
                  onChange={e => updateRow(row.id, { link: e.target.value, status: 'idle', msg: '' })}
                  placeholder="https://www.instagram.com/..."
                  disabled={disabled}
                  className={inputCls}
                />
              </div>

              {/* Qty + Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    จำนวน
                    {svc && <span className="ml-1 normal-case text-[#475569]">({Number(svc.min).toLocaleString()}–{Number(svc.max).toLocaleString()})</span>}
                  </label>
                  <input
                    type="number"
                    value={row.qty}
                    onChange={e => updateRow(row.id, { qty: e.target.value, status: 'idle', msg: '' })}
                    placeholder={svc ? String(svc.min) : '0'}
                    min={svc?.min} max={svc?.max}
                    disabled={disabled}
                    className={`${inputCls} ${qtyInvalid ? '!border-rose-500/50' : ''}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>ราคา</label>
                  <div className="px-3 py-2.5 rounded-xl border border-[rgba(139,92,246,0.12)] bg-[rgba(255,255,255,0.02)] min-h-[42px] flex items-center">
                    <span className="font-mono text-[#06B6D4] text-sm font-semibold">
                      {cost !== null ? `฿${cost.toFixed(2)}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              {row.status !== 'idle' && (
                <div className={[
                  'flex items-center gap-2 text-xs px-3 py-2 rounded-lg',
                  row.status === 'loading'  ? 'text-[#8B5CF6] bg-[rgba(139,92,246,0.08)]' : '',
                  row.status === 'success'  ? 'text-emerald-400 bg-emerald-500/8' : '',
                  row.status === 'error'    ? 'text-rose-400 bg-rose-500/8' : '',
                ].join(' ')}>
                  {row.status === 'loading' && <span className="animate-spin w-3 h-3 border border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full shrink-0" />}
                  {row.status === 'success' && <BsCheckCircle size={12} className="shrink-0" />}
                  {row.status === 'error'   && <BsExclamationCircle size={12} className="shrink-0" />}
                  <span>{row.status === 'loading' ? 'กำลังส่ง...' : row.msg}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DESKTOP: table layout ── */}
      <div className="hidden lg:block glass overflow-x-auto rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(139,92,246,0.12)] text-[#94A3B8] text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 w-36">Service ID</th>
              <th className="text-left px-4 py-3 w-56">ชื่อบริการ</th>
              <th className="text-left px-4 py-3">Link / URL</th>
              <th className="text-left px-4 py-3 w-36">จำนวน</th>
              <th className="text-left px-4 py-3 w-28">ราคา</th>
              <th className="text-left px-4 py-3 w-44">สถานะ</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const svcId = Number(row.serviceId);
              const svc   = svcMap[svcId];
              const qty   = Number(row.qty);
              const cost  = svc && qty > 0 ? calcCostThb(qty, Number(svc.rate)) : null;
              const qtyMin = svc ? Number(svc.min) : 0;
              const qtyMax = svc ? Number(svc.max) : Infinity;
              const qtyInvalid = row.qty && svc && (qty < qtyMin || qty > qtyMax);
              const disabled = row.status === 'loading' || row.status === 'success';

              return (
                <tr key={row.id} className="border-b border-[rgba(139,92,246,0.05)] hover:bg-[rgba(139,92,246,0.03)] transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.serviceId}
                      onChange={e => updateRow(row.id, { serviceId: e.target.value, status: 'idle', msg: '' })}
                      placeholder="เช่น 1234"
                      disabled={disabled}
                      className={`${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[160px]">
                    {svc ? (
                      <div>
                        <p className="text-white text-xs font-medium leading-snug line-clamp-2">{svc.name}</p>
                        <p className="text-[#475569] text-[11px] mt-0.5">฿{Number(svc.rate).toFixed(4)}/1K · {Number(svc.min).toLocaleString()}–{Number(svc.max).toLocaleString()}</p>
                      </div>
                    ) : row.serviceId ? (
                      <p className="text-rose-400 text-xs">ไม่พบบริการ</p>
                    ) : (
                      <p className="text-[#475569] text-xs">—</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="url"
                      value={row.link}
                      onChange={e => updateRow(row.id, { link: e.target.value, status: 'idle', msg: '' })}
                      placeholder="https://..."
                      disabled={disabled}
                      className={inputCls}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={e => updateRow(row.id, { qty: e.target.value, status: 'idle', msg: '' })}
                      placeholder={svc ? String(svc.min) : '0'}
                      min={svc?.min} max={svc?.max}
                      disabled={disabled}
                      className={`${inputCls} ${qtyInvalid ? '!border-rose-500/50' : ''}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-[#06B6D4] text-xs font-semibold">
                    {cost !== null ? `฿${cost.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === 'loading' && (
                      <span className="flex items-center gap-1.5 text-[#8B5CF6] text-xs">
                        <span className="animate-spin w-3 h-3 border border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full inline-block" />
                        กำลังส่ง...
                      </span>
                    )}
                    {row.status === 'success' && (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                        <BsCheckCircle size={12} className="shrink-0" />
                        <span className="truncate">{row.msg}</span>
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="flex items-center gap-1.5 text-rose-400 text-xs">
                        <BsExclamationCircle size={12} className="shrink-0" />
                        <span className="truncate">{row.msg}</span>
                      </span>
                    )}
                    {row.status === 'idle' && <span className="text-[#475569] text-xs">รอ</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1 || disabled}
                      className="text-[#475569] hover:text-rose-400 transition-colors disabled:opacity-30 p-1"
                      aria-label="ลบแถว"
                    >
                      <BsTrash size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <button
          type="button"
          onClick={addRow}
          className="glass-tab flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:text-white transition-colors font-medium"
        >
          <BsPlus size={18} /> เพิ่มแถว
        </button>

        <div className="flex items-center gap-4">
          {activeRows.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#64748b]">{activeRows.length} ออเดอร์ · รวม</p>
              <p className="font-[family-name:var(--font-jakarta)] text-xl font-bold text-[#06B6D4] text-glow-cyan">
                ฿{totalCost.toFixed(2)}
              </p>
              {balance !== null && (
                <p className={`text-xs mt-0.5 ${balance >= totalCost ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {balance >= totalCost ? 'ยอดเพียงพอ' : `ขาดอีก ฿${(totalCost - balance).toFixed(2)}`}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={submitAll}
            disabled={activeRows.length === 0 || submitting || (balance !== null && balance < totalCost)}
            className="btn-primary flex items-center gap-2 px-6 py-3.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? (
              <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block" /> กำลังส่ง...</>
            ) : (
              <>ส่งออเดอร์ทั้งหมด ({activeRows.length}) <BsArrowRight size={14} /></>
            )}
          </button>
        </div>
      </div>

      {/* Done */}
      {rows.some(r => r.status === 'success') && !submitting && (
        <div className="glass p-4 flex items-center justify-between border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
          <p className="text-sm text-emerald-400">
            ส่งออเดอร์สำเร็จ {rows.filter(r => r.status === 'success').length}/{activeRows.length} รายการ
          </p>
          <Link href="/orders" className="flex items-center gap-1.5 text-sm text-emerald-300 hover:text-emerald-200 transition-colors">
            ดูออเดอร์ <BsArrowRight size={12} />
          </Link>
        </div>
      )}
    </main>
  );
}
