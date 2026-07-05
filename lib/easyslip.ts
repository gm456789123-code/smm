export interface EasySlipResult {
  success: boolean;
  data?: {
    ref:       string;
    date:      string;
    countryCode: string;
    amount: { amount: number; local: { amount: number; currency: string } };
    sender: {
      bank: { id: string; name: string; short: string };
      account: { name: { th: string; en: string }; bank: { account?: string } };
    };
    receiver: {
      bank: { id: string; name: string; short: string };
      account: { name: { th: string; en: string }; bank: { account?: string } };
      merchantId?: string;
    };
  };
  error?: { code: string; message: string };
}

export async function verifySlip(file: Blob, filename = 'slip.jpg'): Promise<EasySlipResult> {
  const apiKey = process.env.EASYSLIP_API_KEY ?? '';
  if (!apiKey) throw new Error('EASYSLIP_API_KEY not set');

  const form = new FormData();
  form.append('file', file, filename);

  const res = await fetch('https://api.easyslip.com/v2/verify/bank', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body:    form,
  });

  return res.json();
}
