import { NextRequest, NextResponse } from 'next/server';

const PROMPTPAY = process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER ?? '';

// Cache static QR (no amount) — changes only if account changes
let staticCached: { dataUrl: string; payload: string } | null = null;

async function generateQR(amount?: number): Promise<{ dataUrl: string; payload: string }> {
  const apiKey = process.env.EASYSLIP_API_KEY ?? '';
  if (!apiKey) throw new Error('EASYSLIP_API_KEY not set');

  const body: Record<string, unknown> = PROMPTPAY.length === 13
    ? { type: 'PROMPTPAY', natId: PROMPTPAY }
    : { type: 'PROMPTPAY', msisdn: PROMPTPAY };

  if (amount && amount > 0) body.amount = amount;

  const res = await fetch('https://api.easyslip.com/v1/qr/generate', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await res.json();
  if (data.status !== 200 || !data.data?.image) throw new Error('QR generation failed');

  return {
    dataUrl: `data:${data.data.mime};base64,${data.data.image}`,
    payload: data.data.payload,
  };
}

export async function GET(req: NextRequest) {
  if (!PROMPTPAY) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_PROMPTPAY_NUMBER not set' }, { status: 500 });
  }

  const amountParam = req.nextUrl.searchParams.get('amount');
  const amount = amountParam ? Number(amountParam) : undefined;

  try {
    // QR ที่มียอดเงิน ไม่ cache (unique per amount)
    if (amount && amount > 0) {
      const result = await generateQR(amount);
      return NextResponse.json(result);
    }

    // Static QR — cache in memory
    if (!staticCached) staticCached = await generateQR();
    return NextResponse.json(staticCached);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'QR generation failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
