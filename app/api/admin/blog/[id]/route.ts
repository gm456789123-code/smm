import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import db from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  return user?.role === 'admin' ? user : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-blog:put:${ip}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const fields = ['title','slug','excerpt','content','cover_image','published'];
  const updates = Object.entries(body).filter(([k]) => fields.includes(k));
  if (!updates.length) return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะอัปเดต' }, { status: 400 });

  // set published_at when publishing
  if (body.published === 1) updates.push(['published_at', new Date().toISOString()]);

  const set = updates.map(([k]) => `${k}=?`).join(', ');
  const vals = [...updates.map(([,v]) => v), id];
  await db.query(`UPDATE blog_posts SET ${set} WHERE id=?`, vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-blog:delete:${ip}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await db.query('DELETE FROM blog_posts WHERE id=?', [id]);
  return NextResponse.json({ ok: true });
}
