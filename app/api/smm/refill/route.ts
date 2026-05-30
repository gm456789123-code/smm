import { NextRequest, NextResponse } from 'next/server';
import { smmApi } from '@/lib/smm-api';

// POST /api/smm/refill — create refill
// body: { order: "123" } or { orders: ["1","2","3"] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order, orders } = body;

    if (order) {
      const data = await smmApi.createRefill(order);
      return NextResponse.json(data);
    }
    if (orders && Array.isArray(orders)) {
      const data = await smmApi.createMultiRefill(orders);
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Provide order or orders' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// GET /api/smm/refill?refill=1 or ?refills=1,2,3
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const refill = searchParams.get('refill');
    const refills = searchParams.get('refills');

    if (refill) {
      const data = await smmApi.refillStatus(refill);
      return NextResponse.json(data);
    }
    if (refills) {
      const data = await smmApi.multiRefillStatus(refills.split(','));
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Provide refill or refills param' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
