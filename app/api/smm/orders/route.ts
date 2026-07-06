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
    const { service, link, quantity, runs, interval, provider } = body;
    if (!service || !link || !quantity) {
      return NextResponse.json({ error: 'service, link, quantity are required' }, { status: 400 });
    }
    const api = getProviderApi(provider ?? '24social');
    const data = await api.addOrder({ service, link, quantity, runs, interval });
    return NextResponse.json({ ...data, provider: api.provider });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
export async function GET(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = req.nextUrl;
    const order = searchParams.get('order');
    const orders = searchParams.get('orders');
    const provider = searchParams.get('provider') ?? '24social';
    const api = getProviderApi(provider);
    if (order) {
      const data = await api.orderStatus(order);
      return NextResponse.json(data);
    }
    if (orders) {
      const data = await api.multiOrderStatus(orders.split(','));
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Provide order or orders param' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
