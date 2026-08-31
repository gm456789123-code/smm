import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export interface PaymentSettings {
  promptpayNumber: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  truewalletId: string;
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (
        'promptpay_number',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'truewallet_id'
      )`
    );
    const map = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value ?? '']));
    return {
      promptpayNumber: (map.promptpay_number || process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || '').trim(),
      bankName: (map.bank_name || process.env.NEXT_PUBLIC_BANK_NAME || 'ธนาคาร').trim(),
      bankAccountName: (map.bank_account_name || process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'ชื่อบัญชี').trim(),
      bankAccountNumber: (map.bank_account_number || process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '').trim(),
      truewalletId: (map.truewallet_id || process.env.NEXT_PUBLIC_TRUEWALLET_ID || '').trim(),
    };
  } catch (err) {
    console.error('[getPaymentSettings] DB query error:', err);
    return {
      promptpayNumber: (process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || '').trim(),
      bankName: (process.env.NEXT_PUBLIC_BANK_NAME || 'ธนาคาร').trim(),
      bankAccountName: (process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'ชื่อบัญชี').trim(),
      bankAccountNumber: (process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '').trim(),
      truewalletId: (process.env.NEXT_PUBLIC_TRUEWALLET_ID || '').trim(),
    };
  }
}
