import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { Service, getProviderApi } from '@/lib/smm-api';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit } from '@/lib/rate-limit';

const _svcCache: Record<string, { data: Service[]; exp: number }> = {};
async function getCachedServices(provider: string): Promise<Service[]> {
  const c = _svcCache[provider];
  if (c && c.exp > Date.now()) return c.data;
  const data = await getProviderApi(provider).services();
  _svcCache[provider] = { data, exp: Date.now() + 10 * 60 * 1000 };
  return data;
}

const EXCHANGE_RATE = Number(process.env.SMM_EXCHANGE_RATE ?? 36);
const MARKUP = Number(process.env.SMM_MARKUP ?? 1.3);

function calcCostThb(quantity: number, rateUsd: number): number {
  return Math.ceil((quantity / 1000) * rateUsd * EXCHANGE_RATE * MARKUP * 100) / 100;
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`order:${user.userId}`, 10, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

  const body = await req.json();
  const serviceId = Number(body.serviceId);
  const provider  = String(body.provider ?? '24social');
  const link = String(body.link ?? '').trim();
  const quantity = Math.floor(Number(body.quantity));
  const runs = body.runs ? Math.floor(Number(body.runs)) : undefined;
  const interval = body.interval ? Math.floor(Number(body.interval)) : undefined;

  if (!serviceId || !link || !quantity) {
    return NextResponse.json({ error: 'serviceId, link, and quantity are required.' }, { status: 400 });
  }
  if (quantity <= 0) {
    return NextResponse.json({ error: 'quantity must be greater than 0.' }, { status: 400 });
  }
  if (runs !== undefined && (runs < 2 || runs > 100)) {
    return NextResponse.json({ error: 'runs must be between 2 and 100.' }, { status: 400 });
  }
  if (interval !== undefined && (interval < 1 || interval > 1440)) {
    return NextResponse.json({ error: 'interval must be between 1 and 1440 minutes.' }, { status: 400 });
  }
  try { new URL(link); } catch {
    return NextResponse.json({ error: 'link must be a valid URL.' }, { status: 400 });
  }

  const services = await getCachedServices(provider);
  const service = services.find((item) => Number(item.service) === serviceId);
  if (!service) {
    return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
  }

  const min = Number(service.min);
  const max = Number(service.max);
  if (quantity < min || quantity > max) {
    return NextResponse.json({
      error: `quantity must be between ${min.toLocaleString()} and ${max.toLocaleString()}.`,
    }, { status: 400 });
  }

  const costThb = calcCostThb(quantity, Number(service.rate));
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT balance FROM users WHERE id = ? FOR UPDATE',
      [user.userId]
    );
    const balance = Number(rows[0]?.balance ?? 0);
    if (balance < costThb) {
      await conn.rollback();
      return NextResponse.json({
        error: `Insufficient balance. Current: THB ${balance.toFixed(2)}, required: THB ${costThb.toFixed(2)}.`,
      }, { status: 402 });
    }

    await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [costThb, user.userId]);

    let smmOrderId: number | null = null;
    let apiError: string | null = null;

    try {
      const smmResult = await getProviderApi(provider).addOrder({
        service: String(serviceId),
        link,
        quantity: String(quantity),
        ...(runs !== undefined && { runs: String(runs) }),
        ...(interval !== undefined && { interval: String(interval) }),
      });
      smmOrderId = smmResult.order;
    } catch (err) {
      apiError = err instanceof Error ? err.message : String(err);
      console.error('[orders/POST] SMM API error:', apiError);
      // คืนเงินลูกค้าทันที
      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [costThb, user.userId]);
      await conn.commit();
      return NextResponse.json({
        error: 'ขณะนี้บริการนี้ไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่ภายหลัง',
      }, { status: 503 });
    }

    await conn.query(
      `INSERT INTO transactions
         (user_id, tx_type, amount, ref, tx_status, note, provider, api_failed, api_error, service_id, link_url, qty)
       VALUES (?, 'spend', ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.userId,
        costThb,
        String(smmOrderId),
        `${service.name} | ${link}`,
        service.provider,
        0,
        null,
        serviceId,
        link,
        quantity,
      ]
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      orderId: smmOrderId,
      cost: costThb,
      balance: Math.round((balance - costThb) * 100) / 100,
    }, { status: 201 });

  } catch (error) {
    await conn.rollback();
    console.error('[orders/POST]', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = Math.min(Number(limitParam) || 50, 200);

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, amount, ref, tx_status, note, provider, api_failed, api_error,
            service_id, link_url, qty, created_at
     FROM transactions
     WHERE user_id = ? AND tx_type = 'spend'
     ORDER BY created_at DESC
     LIMIT ?`,
    [user.userId, limit]
  );
  return NextResponse.json(rows);
}
