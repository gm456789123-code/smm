import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { smmApi, kmApi } from '@/lib/smm-api';
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const [s1, s2] = await Promise.allSettled([smmApi.services(), kmApi.services()]);
    const services = [
      ...(s1.status === 'fulfilled' ? s1.value : []),
      ...(s2.status === 'fulfilled' ? s2.value : []),
    ].filter(s => !s.type?.includes('ห้ามสั่งซื้อ'));
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
