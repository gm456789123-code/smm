import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { getProviderApi } from '@/lib/smm-api';
async function auth(req: NextRequest) {
  return getRequestUser(req);
}
export async function POST(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { order, orders, provider } = body;
    const api = getProviderApi(provider ?? '24social');
    if (order) {
      const data = await api.createRefill(order);
      return NextResponse.json(data);
    }
    if (orders && Array.isArray(orders)) {
      const data = await api.createMultiRefill(orders);
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Provide order or orders' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = req.nextUrl;
    const refill = searchParams.get('refill');
    const refills = searchParams.get('refills');
    const provider = searchParams.get('provider') ?? '24social';
    const api = getProviderApi(provider);
    if (refill) {
      const data = await api.refillStatus(refill);
      return NextResponse.json(data);
    }
    if (refills) {
      const data = await api.multiRefillStatus(refills.split(','));
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Provide refill or refills param' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
