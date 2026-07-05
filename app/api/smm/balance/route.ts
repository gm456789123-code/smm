import { NextRequest, NextResponse } from 'next/server';
import { smmApi, kmApi } from '@/lib/smm-api';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const [b1, b2] = await Promise.allSettled([smmApi.balance(), kmApi.balance()]);
    return NextResponse.json({
      '24social': b1.status === 'fulfilled' ? b1.value : { error: 'ไม่สามารถดึงยอดได้' },
      'km-social': b2.status === 'fulfilled' ? b2.value : { error: 'ไม่สามารถดึงยอดได้' },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
