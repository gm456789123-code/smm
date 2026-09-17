import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { getProviderApi } from '@/lib/smm-api';
export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { orders, provider } = body;
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ error: 'orders array is required' }, { status: 400 });
    }
    const api = getProviderApi(provider ?? '24social');
    const data = await api.cancelOrders(orders);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
