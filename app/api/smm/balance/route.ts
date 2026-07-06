import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { smmApi, kmApi } from '@/lib/smm-api';
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const [b1, b2] = await Promise.allSettled([smmApi.balance(), kmApi.balance()]);
    return NextResponse.json({
      '24social': b1.status === 'fulfilled' ? b1.value : { error: 'Unable to load balance' },
      'km-social': b2.status === 'fulfilled' ? b2.value : { error: 'Unable to load balance' },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
