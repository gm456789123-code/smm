import { NextRequest, NextResponse } from 'next/server';
import { smmApi, kmApi } from '@/lib/smm-api';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const [s1, s2] = await Promise.allSettled([smmApi.services(), kmApi.services()]);
    const services = [
      ...(s1.status === 'fulfilled' ? s1.value : []),
      ...(s2.status === 'fulfilled' ? s2.value : []),
    ];
    return NextResponse.json(services);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
