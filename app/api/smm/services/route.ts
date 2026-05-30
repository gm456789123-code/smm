import { NextResponse } from 'next/server';
import { smmApi } from '@/lib/smm-api';

export async function GET() {
  try {
    const data = await smmApi.services();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
