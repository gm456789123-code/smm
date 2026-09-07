import db from '@/lib/db';
import { getProviderApi, type OrderStatus } from '@/lib/smm-api';
import type { ResultSetHeader } from 'mysql2';

export interface SyncOrder {
  id: number;
  ref: string | null;
  provider: string | null;
  tx_type: string;
  tx_status: string;
  status_locked?: number;
  api_failed?: number;
  note?: string | null;
}

const ACTIVE = new Set(['pending', 'in_progress', 'processing']);
const STATUS: Record<string, string> = {
  completed: 'completed', canceled: 'cancelled', cancelled: 'cancelled',
  partial: 'partial', 'in progress': 'in_progress', processing: 'in_progress', pending: 'pending',
};

export async function syncOrderStatuses<T extends SyncOrder>(orders: T[]) {
  const rows = orders.map((row) => ({ ...row, smm: null as OrderStatus | null, sync_error: false }));
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    if (row.tx_type !== 'spend' || !row.ref || row.api_failed || row.status_locked || !ACTIVE.has(row.tx_status) || row.note?.includes('[คืนเงินแล้ว')) continue;
    const provider = row.provider || 'km-social';
    if (!['km-social', '24social'].includes(provider)) { row.sync_error = true; continue; }
    const group = groups.get(provider) ?? [];
    group.push(row);
    groups.set(provider, group);
  }
  await Promise.all([...groups].map(async ([provider, group]) => {
    for (let offset = 0; offset < group.length; offset += 50) {
      const chunk = group.slice(offset, offset + 50);
      try {
        const statuses = await getProviderApi(provider).multiOrderStatus([...new Set(chunk.map((row) => String(row.ref)))]);
        for (const row of chunk) {
          const data = statuses?.[String(row.ref)];
          if (!data || !('status' in data) || typeof data.status !== 'string') { row.sync_error = true; continue; }
          const mapped = STATUS[data.status.toLowerCase()];
          if (!mapped) { row.sync_error = true; continue; }
          // A delayed response must not undo a refund, manual edit, or another sync.
          if (mapped !== row.tx_status) {
            const [updated] = await db.query<ResultSetHeader>(
              "UPDATE transactions SET tx_status = ? WHERE id = ? AND tx_type = 'spend' AND tx_status = ? AND status_locked = 0",
              [mapped, row.id, row.tx_status],
            );
            if (updated.affectedRows !== 1) { row.sync_error = true; continue; }
            row.tx_status = mapped;
          }
          row.smm = data;
        }
      } catch {
        for (const row of chunk) row.sync_error = true;
      }
    }
  }));
  return rows;
}
