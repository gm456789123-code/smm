import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { sendAdminPush } from '@/lib/push';

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await sendAdminPush({
    title: '🔔 ทดสอบระบบแจ้งเตือน',
    body: 'Push notification ทำงานปกติ ✅',
    url: '/admin/orders',
    tag: 'push-test',
  });

  return NextResponse.json({ ok: true });
}
