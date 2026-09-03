import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { kmApi } from '@/lib/smm-api';
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // 24social is temporarily disabled, using only km-social
    const s2 = await kmApi.services();
    const services = s2
      .filter(s => !s.type?.includes('ห้ามสั่งซื้อ'))
      .filter(s => !(s.provider === 'km-social' && /youtube/i.test(s.category + ' ' + s.name)));
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
