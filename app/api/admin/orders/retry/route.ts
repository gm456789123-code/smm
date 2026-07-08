import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { getProviderApi } from '@/lib/smm-api';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { txId } = await req.json();
  if (!txId) return NextResponse.json({ error: 'txId required' }, { status: 400 });

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT * FROM transactions WHERE id = ? AND tx_type = 'spend' AND api_failed = 1 LIMIT 1`,
    [txId]
  );
  const tx = rows[0];
  if (!tx) return NextResponse.json({ error: 'Transaction not found or not retryable' }, { status: 404 });

  const provider = tx.provider ?? '24social';
  const api = getProviderApi(provider);

  try {
    const result = await api.addOrder({
      service: String(tx.service_id),
      link: tx.link_url,
      quantity: String(tx.qty),
    });

    await db.query(
      `UPDATE transactions
       SET ref = ?, api_failed = 0, api_error = NULL, tx_status = 'pending'
       WHERE id = ?`,
      [String(result.order), txId]
    );

    return NextResponse.json({ success: true, orderId: result.order });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db.query(
      `UPDATE transactions SET api_error = ? WHERE id = ?`,
      [errMsg, txId]
    );
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }
}
