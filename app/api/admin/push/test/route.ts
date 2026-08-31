import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { sendAdminPush } from '@/lib/push';

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await sendAdminPush({
    title: '🔔 ทดสอบระบบแจ้งเตือนแอดมิน',
    body: 'AURA SMM: มีออเดอร์/รายการใหม่เข้าสู่ระบบ ✅',
    url: '/admin/orders',
    tag: `push-test-${Date.now()}`,
  });

  return NextResponse.json({ ok: true, result });
}
