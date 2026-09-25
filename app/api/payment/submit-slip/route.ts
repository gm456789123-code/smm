import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { insertPendingTx } from '@/lib/credit-topup';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendAdminPush } from '@/lib/push';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { getUploadDir } from '@/lib/upload-dir';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_CHANNELS = new Set(['promptpay', 'bank', 'truewallet']);

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = checkRateLimit(`submit-slip:${user.userId}`, 5, 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  const channel = String(form.get('channel') ?? 'bank');
  const amount = Number(form.get('amount'));

  if (!file) return NextResponse.json({ error: 'กรุณาแนบไฟล์สลิป' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'จำนวนเงินไม่ถูกต้อง' }, { status: 400 });
  }
  if (!ALLOWED_CHANNELS.has(channel)) {
    return NextResponse.json({ error: 'ช่องทางไม่ถูกต้อง' }, { status: 400 });
  }

  const ext = extname(file.name).toLowerCase() || '.jpg';
  const name = `slip-${randomUUID()}${ext}`;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
  const proofUrl = `/api/files/${name}`;

  const ref = `slip:${randomUUID()}`;
  const channelLabel = channel === 'promptpay' ? 'PromptPay' : channel === 'truewallet' ? 'TrueMoney Wallet' : 'โอนธนาคาร';

  const pending = await insertPendingTx({
    userId: user.userId,
    amount,
    ref,
    txType: 'topup',
    provider: 'slip',
    proofUrl,
    note: `สลิป${channelLabel} | ผู้ใช้แจ้งยอด ฿${amount} | รอแอดมินตรวจสอบ`,
  });

  if (pending.status === 'duplicate') {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 409 });
  }
  if (pending.status === 'error') {
    return NextResponse.json({ error: pending.message }, { status: 500 });
  }

  sendAdminPush({
    title: '🧾 มีสลิปรอตรวจสอบ',
    body: `ผู้ใช้ ${user.username} ส่งสลิป${channelLabel} แจ้งยอด ฿${amount.toLocaleString('th-TH')}`,
    url: '/admin/topups',
    tag: `topup-slip-${ref}`,
  }).catch(() => {});

  return NextResponse.json({ success: true, pending: true, ref });
}
