import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { getProviderApi } from '@/lib/smm-api';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { sendOrderCompleteEmail } from '@/lib/email';

// Map SMM provider status → our tx_status
function mapStatus(smmStatus: string): string {
  const s = smmStatus.toLowerCase();
  if (s === 'completed')              return 'completed';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'partial')                return 'partial';
  if (s === 'in progress' || s === 'processing') return 'in_progress';
  return 'pending';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const txId = Number(id);
  if (!txId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Fetch transaction — must belong to this user
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, ref, provider, tx_status, service_id, link_url, qty, amount, note, api_failed, created_at
     FROM transactions WHERE id = ? AND user_id = ? AND tx_type = 'spend'`,
    [txId, user.userId]
  );
  const tx = rows[0];
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // If no SMM order ID (API failed at placement), return DB data as-is
  if (!tx.ref) {
    return NextResponse.json({ ...tx, smm: null });
  }

  // Fetch live status from SMM provider
  try {
    const api = getProviderApi(tx.provider ?? '24social');
    const smm = await api.orderStatus(String(tx.ref));

    const newStatus = mapStatus(smm.status ?? '');

    // Update DB status when it changes
    if (newStatus !== tx.tx_status && newStatus !== 'pending') {
      await db.query(
        'UPDATE transactions SET tx_status = ? WHERE id = ?',
        [newStatus, txId]
      );

      // Send email when order completes
      if (newStatus === 'completed' && user.email) {
        const serviceName = String(tx.note ?? '').split(' | ')[0] || `Order #${tx.ref}`;
        sendOrderCompleteEmail(user.email, user.username, serviceName, String(tx.ref), Number(tx.amount))
          .catch(() => {});
      }

      tx.tx_status = newStatus;
    }

    return NextResponse.json({ ...tx, smm });
  } catch {
    // SMM API unreachable — return what we have in DB
    return NextResponse.json({ ...tx, smm: null });
  }
}
