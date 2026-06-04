import { NextRequest, NextResponse } from 'next/server';
import { smmApi } from '@/lib/smm-api';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const data = await smmApi.balance();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
