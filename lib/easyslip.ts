export interface EasySlipResult {
  success: boolean;
  data?: {
    ref:         string;
    date:        string;
    countryCode: string;
    amount: { amount: number; local: { amount: number; currency: string } };
    sender: {
      bank:    { id: string; name: string; short: string };
      account: { name: { th: string; en: string }; bank: { account?: string } };
    };
    receiver: {
      bank:       { id: string; name: string; short: string };
      account:    { name: { th: string; en: string }; bank: { account?: string } };
      merchantId?: string;
    };
  };
  error?: { code: string; message: string };
}

export interface TrueWalletResult {
  status: number;
  data?: {
    ref:    string;
    date:   string;
    amount: number;
    sender:   { name: string; mobile?: string };
    receiver: { name: string; mobile?: string };
    type?:  string; // 'transfer' | 'angpao' etc.
  };
  message?: string;
}

function getKey() {
  const k = process.env.EASYSLIP_API_KEY ?? '';
  if (!k) throw new Error('EASYSLIP_API_KEY not set');
  return k;
}

// v2 — Thai bank transfer slips (18+ banks)
export async function verifyBankSlip(file: Blob, filename = 'slip.jpg'): Promise<EasySlipResult> {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await fetch('https://api.easyslip.com/v2/verify/bank', {
    method:  'POST',
    headers: { Authorization: `Bearer ${getKey()}` },
    body:    form,
  });
  return res.json();
}

// v1 — TrueMoney Wallet + Angpao slips
export async function verifyTrueWallet(file: Blob, filename = 'slip.jpg'): Promise<TrueWalletResult> {
  const form = new FormData();
  form.append('file', file, filename);
  const res = await fetch('https://api.easyslip.com/v1/verify/truewallet', {
    method:  'POST',
    headers: { Authorization: `Bearer ${getKey()}` },
    body:    form,
  });
  return res.json();
}
