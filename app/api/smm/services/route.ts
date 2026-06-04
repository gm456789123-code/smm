import { NextRequest, NextResponse } from 'next/server';
import { smmApi } from '@/lib/smm-api';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token || !await verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const data = await smmApi.services();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
