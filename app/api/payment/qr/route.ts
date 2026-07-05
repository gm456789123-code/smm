import { NextResponse } from 'next/server';

const PROMPTPAY = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER ?? '';

// Cache QR in memory — it never changes for a static account
let cached: { dataUrl: string; payload: string } | null = null;

export async function GET() {
  if (!PROMPTPAY) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_PROMPTPAY_NUMBER not set' }, { status: 500 });
  }

  if (cached) return NextResponse.json(cached);

  const apiKey = process.env.EASYSLIP_API_KEY ?? '';
  if (!apiKey) return NextResponse.json({ error: 'EASYSLIP_API_KEY not set' }, { status: 500 });

  const body = PROMPTPAY.length === 13
    ? { type: 'PROMPTPAY', natId: PROMPTPAY }      // citizen ID
    : { type: 'PROMPTPAY', msisdn: PROMPTPAY };    // phone number

  const res = await fetch('https://api.easyslip.com/v1/qr/generate', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    next:    { revalidate: 86400 }, // re-fetch once a day max
  });

  const data = await res.json();

  if (data.status !== 200 || !data.data?.image) {
    return NextResponse.json({ error: 'QR generation failed' }, { status: 502 });
  }

  cached = {
    dataUrl: `data:${data.data.mime};base64,${data.data.image}`,
    payload: data.data.payload,
  };

  return NextResponse.json(cached);
}
