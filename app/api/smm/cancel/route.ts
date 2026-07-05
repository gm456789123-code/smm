import { NextRequest, NextResponse } from 'next/server';
import { getProviderApi } from '@/lib/smm-api';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { orders, provider } = body;
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 });
    }
    const api  = getProviderApi(provider ?? '24social');
    const data = await api.cancelOrders(orders);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
