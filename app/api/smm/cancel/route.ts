import { NextRequest, NextResponse } from 'next/server';
import { smmApi } from '@/lib/smm-api';

// POST /api/smm/cancel
// body: { orders: ["1","2","3"] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orders } = body;
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 });
    }
    const data = await smmApi.cancelOrders(orders);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
