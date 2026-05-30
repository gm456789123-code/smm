import { NextRequest, NextResponse } from 'next/server';
import { smmApi } from '@/lib/smm-api';

// POST /api/smm/orders — add order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { service, link, quantity, runs, interval } = body;
    if (!service || !link || !quantity) {
      return NextResponse.json({ error: 'service, link, quantity are required' }, { status: 400 });
    }
    const data = await smmApi.addOrder({ service, link, quantity, runs, interval });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET /api/smm/orders?order=123 or ?orders=1,2,3
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const order = searchParams.get('order');
    const orders = searchParams.get('orders');

    if (order) {
      const data = await smmApi.orderStatus(order);
      return NextResponse.json(data);
    }
    if (orders) {
      const data = await smmApi.multiOrderStatus(orders.split(','));
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Provide order or orders param' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
