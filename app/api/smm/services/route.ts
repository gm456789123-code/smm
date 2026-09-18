import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { smmApi, kmApi } from '@/lib/smm-api';

const MISSING_KEYWORDS = ['telegram', 'spotify', 'discord', 'linkedin', 'whatsapp'];

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // 1. ดึงบริการหลักจาก 24social
    const p1 = smmApi.services()
      .then(list => list.filter(s => !s.type?.includes('ห้ามสั่งซื้อ')))
      .catch(err => {
        console.error('[services] 24social error:', err);
        return [];
      });

    // 2. ดึงบริการเสริมจาก km-social เฉพาะหมวดหมู่ที่ 24social ไม่มี (Telegram, Spotify, Discord, LinkedIn, WhatsApp)
    const p2 = kmApi.services()
      .then(list =>
        list
          .filter(s => !s.type?.includes('ห้ามสั่งซื้อ'))
          .filter(s => {
            const text = (s.category + ' ' + s.name).toLowerCase();
            return MISSING_KEYWORDS.some(kw => text.includes(kw));
          })
      )
      .catch(err => {
        console.error('[services] km-social error:', err);
        return [];
      });

    const [s1, s2] = await Promise.all([p1, p2]);
    return NextResponse.json([...s1, ...s2]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
