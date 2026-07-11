export interface BankSlipResponse {
  success: boolean;
  data?: {
    isDuplicate:    boolean;
    amountInSlip:   number;
    matchedAccount?: null | object;
    rawSlip: {
      transRef:    string;
      date:        string;
      countryCode: string;
      amount:      { amount: number; local: { amount: number; currency: string } };
      fee:         number;
      sender: {
        bank:    { id: string; name: string; short: string };
        account: { name: { th?: string; en?: string } };
      };
      receiver: {
        bank?:   { id: string; name: string; short: string };
        account: {
          name:   { th?: string; en?: string };
          proxy?: { type: string; account: string };
          bank?:  { type: string; account: string };
        };
        merchantId?: string | null;
      };
    };
  };
  error?: { code: string; message: string };
}

export interface TrueWalletResponse {
  success: boolean;
  data?: {
    isDuplicate:    boolean;
    amountInSlip:   number;
    matchedAccount: null | object;
    rawSlip: {
      transactionId: string;
      date:          string;
      amount:        number;
      sender:        { name: string };
      receiver:      { name: string; phone: string };
    };
  };
  error?: { code: string; message: string };
}

function getKey() {
  const k = process.env.EASYSLIP_API_KEY ?? '';
  if (!k) throw new Error('EASYSLIP_API_KEY not set');
  return k;
}

// v2 — Thai bank transfer slips (18+ banks + PromptPay)
export async function verifyBankSlip(file: Blob, filename = 'slip.jpg'): Promise<BankSlipResponse> {
  const form = new FormData();
  form.append('image', file, filename);          // field name must be "image"
  form.append('checkDuplicate', 'true');

  const res = await fetch('https://api.easyslip.com/v2/verify/bank', {
    method:  'POST',
    headers: { Authorization: `Bearer ${getKey()}` },
    body:    form,
  });
  return res.json();
}

// v2 — TrueMoney Wallet + Angpao slips
export async function verifyTrueWallet(file: Blob, filename = 'slip.jpg'): Promise<TrueWalletResponse> {
  const form = new FormData();
  form.append('image', file, filename);          // field name must be "image"
  form.append('checkDuplicate', 'true');

  const res = await fetch('https://api.easyslip.com/v2/verify/truewallet', {
    method:  'POST',
    headers: { Authorization: `Bearer ${getKey()}` },
    body:    form,
  });
  return res.json();
}
