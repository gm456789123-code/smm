const BASE_URL = 'https://api.me-sms.com/v1';
const TOKEN    = process.env.ME_SMS_TOKEN ?? '';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json() as T;
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

export interface OTPResponse {
  success: boolean;
  data: { uuid: string; msisdn: string; otp: string; ref: string; period: number; expiredAt: string };
}

export interface VerifyResponse {
  success: boolean;
  data: { uuid: string; msisdn: string; expiredAt: string };
}

export interface BalanceResponse {
  success: boolean;
  balance: number;
}

export const meSmS = {
  sendOTP(msisdn: string, period = 300): Promise<OTPResponse> {
    return call<OTPResponse>('POST', '/otp', {
      msisdn,
      period,
      template: 'รหัส OTP ของคุณคือ {otp} หมดอายุใน {expire}',
      sender: 'AURA SMM',
    });
  },

  verifyOTP(msisdn: string, ref: string, otp: string): Promise<VerifyResponse> {
    return call<VerifyResponse>('POST', '/otp/verify', { msisdn, ref, otp });
  },

  balance(): Promise<BalanceResponse> {
    return call<BalanceResponse>('GET', '/users/balance');
  },
};
