import { NextRequest, NextResponse } from 'next/server';
import { getProviderApi } from '@/lib/smm-api';
import { verifyToken } from '@/lib/jwt';

async function auth(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  return token ? await verifyToken(token) : null;
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
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!await auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = req.nextUrl;
    const order    = searchParams.get('order');
    const orders   = searchParams.get('orders');
    const provider = searchParams.get('provider') ?? '24social';
    const api      = getProviderApi(provider);

    if (order) {
      const data = await api.orderStatus(order);
      return NextResponse.json(data);
    }
    if (orders) {
      const data = await api.multiOrderStatus(orders.split(','));
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: 'Provide order or orders param' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
