import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { getProviderApi } from '@/lib/smm-api';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

function mapStatus(smmStatus: string): string {
  const s = (smmStatus || '').toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'partial') return 'partial';
  if (s === 'in progress' || s === 'processing') return 'in_progress';
  if (s === 'pending') return 'pending';
  return smmStatus;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const shouldSync = req.nextUrl.searchParams.get('sync') === '1';

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT t.id, t.user_id, t.tx_type, t.amount, t.ref, t.tx_status, t.note,
            t.provider, t.api_failed, t.api_error, t.service_id, t.link_url, t.qty, t.created_at,
            u.username, u.email
     FROM transactions t
     JOIN users u ON t.user_id = u.id
     ORDER BY t.created_at DESC
     LIMIT 300`
  );

  const liveStatusMap: Record<string, { status: string; start_count?: string; remains?: string; charge?: string; error?: string }> = {};

  if (shouldSync) {
    // Group active orders with ref by provider
    const ordersByProvider: Record<string, string[]> = {};
    for (const r of rows) {
      if (r.ref && r.ref !== 'null' && r.ref !== 'undefined' && !r.api_failed) {
        const prov = r.provider || 'km-social';
        if (!ordersByProvider[prov]) ordersByProvider[prov] = [];
        ordersByProvider[prov].push(String(r.ref));
      }
    }

    // Query multiOrderStatus for each provider
    for (const [provider, orderIds] of Object.entries(ordersByProvider)) {
      if (orderIds.length === 0) continue;
      try {
        const api = getProviderApi(provider);
        for (let i = 0; i < orderIds.length; i += 50) {
          const chunk = orderIds.slice(i, i + 50);
          const results = await api.multiOrderStatus(chunk);
          if (results && typeof results === 'object') {
            for (const [orderId, data] of Object.entries(results)) {
              if (data && typeof data === 'object') {
                if ('status' in data && data.status) {
                  liveStatusMap[orderId] = {
                    status: data.status,
                    start_count: data.start_count,
                    remains: data.remains,
                    charge: data.charge,
                  };

                  const mapped = mapStatus(data.status);
                  const matchingRow = rows.find(r => String(r.ref) === String(orderId));
                  if (matchingRow && matchingRow.tx_status !== mapped && mapped) {
                    await db.query('UPDATE transactions SET tx_status = ? WHERE id = ?', [mapped, matchingRow.id]);
                    matchingRow.tx_status = mapped;
                  }
                } else if ('error' in data && data.error) {
                  liveStatusMap[orderId] = { status: 'error', error: data.error };
                }
              }
            }
          }
        }
      } catch (err) {
        console.error(`[admin/orders] Failed to sync status for ${provider}:`, err);
      }
    }
  }

  const enriched = rows.map(r => {
    const smmData = r.ref ? liveStatusMap[String(r.ref)] : null;
    return {
      ...r,
      smm: smmData || null,
    };
  });

  return NextResponse.json(enriched);
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id, tx_status, note, ref } = await req.json();
    if (!id) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

    const updates: string[] = [];
    const values: any[] = [];

    if (tx_status !== undefined) {
      updates.push('tx_status = ?');
      values.push(tx_status);
    }
    if (note !== undefined) {
      updates.push('note = ?');
      values.push(note);
    }
    if (ref !== undefined) {
      updates.push('ref = ?');
      values.push(ref);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await db.query(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { action, id } = await req.json();
    if (action === 'refund' && id) {
      const [rows] = await db.query<RowDataPacket[]>(
        'SELECT id, user_id, amount, tx_status, tx_type FROM transactions WHERE id = ? LIMIT 1',
        [id]
      );
      const tx = rows[0];
      if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      if (tx.tx_status === 'refunded' || (tx.note && tx.note.includes('[คืนเงินแล้ว'))) {
        return NextResponse.json({ error: 'ออเดอร์นี้ได้ทำการคืนเงินไปแล้ว' }, { status: 400 });
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        const refundAmount = Number(tx.amount || 0);

        if (refundAmount > 0) {
          await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [refundAmount, tx.user_id]);
        }

        await conn.query(
          "UPDATE transactions SET tx_status = 'cancelled', note = CONCAT(COALESCE(note, ''), ' [คืนเงินแล้ว ฿', ?, ' โดยแอดมิน]') WHERE id = ?",
          [refundAmount, id]
        );

        await conn.commit();
        return NextResponse.json({ success: true, refundAmount });
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
