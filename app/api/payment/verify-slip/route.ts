import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { verifyBankSlip, verifyTrueWallet } from '@/lib/easyslip';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit } from '@/lib/rate-limit';

const ERROR_MSG: Record<string, string> = {
  SLIP_NOT_FOUND: 'Slip data was not found. Please upload a clearer image.',
  SLIP_PENDING: 'Slip verification is still pending. Please wait a few minutes and try again.',
  QUOTA_EXCEEDED: 'Verification quota exceeded. Please try again later.',
  INVALID_API_KEY: 'Verification service is misconfigured. Please contact support.',
  IMAGE_SIZE_TOO_LARGE: 'Image is too large. Please upload a file smaller than 4MB.',
  INVALID_IMAGE_FORMAT: 'Unsupported image format. Please use JPEG, PNG, or WebP.',
  INVALID_IMAGE: 'The uploaded image is not a valid TrueMoney slip.',
};

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`verify-slip:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const slipType = String(form.get('type') ?? 'bank');

  if (!file) return NextResponse.json({ error: 'Please attach a slip file.' }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'File is larger than 4MB.' }, { status: 400 });

  let ref: string;
  let amountThb: number;
  let senderName: string;
  let note: string;
  let isDuplicate: boolean;

  try {
    if (slipType === 'truewallet') {
      const result = await verifyTrueWallet(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'Invalid TrueMoney slip.' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup } = result.data;
      ref = rawSlip.transactionId;
      amountThb = amountInSlip;
      senderName = rawSlip.sender.name;
      isDuplicate = dup;
      note = `TrueMoney: ${senderName} -> ${rawSlip.receiver.name} THB ${amountThb}`;
    } else {
      const result = await verifyBankSlip(file, file.name);
      if (!result.success || !result.data) {
        const code = result.error?.code ?? 'UNKNOWN';
        return NextResponse.json({ error: ERROR_MSG[code] ?? 'Invalid bank slip.' }, { status: 422 });
      }
      const { rawSlip, amountInSlip, isDuplicate: dup } = result.data;
      ref = rawSlip.transRef;
      amountThb = amountInSlip;
      senderName = rawSlip.sender.account.name.th || rawSlip.sender.account.name.en || 'Unknown sender';
      isDuplicate = dup;
      const receiverName = rawSlip.receiver.account.name.th || rawSlip.receiver.account.name.en || 'Unknown receiver';
      note = `Bank (${rawSlip.sender.bank.short}->${rawSlip.receiver.bank.short}): ${senderName} -> ${receiverName} THB ${amountThb}`;
    }
  } catch {
    return NextResponse.json({ error: 'Unable to connect to EasySlip.' }, { status: 502 });
  }

  if (isDuplicate) {
    return NextResponse.json({ error: 'This slip has already been used.' }, { status: 409 });
  }

  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM transactions WHERE ref = ? LIMIT 1',
    [ref]
  );
  if (existing.length > 0) {
    return NextResponse.json({ error: 'This slip has already been used.' }, { status: 409 });
  }

  await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountThb, user.userId]);
  await db.query(
    `INSERT INTO transactions (user_id, tx_type, amount, ref, tx_status, note)
     VALUES (?, 'topup', ?, ?, 'completed', ?)`,
    [user.userId, amountThb, ref, note]
  );

  return NextResponse.json({ success: true, amount: amountThb, ref, senderName });
}