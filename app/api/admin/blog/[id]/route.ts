import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeHtml, sanitizeUrl } from '@/lib/sanitize-html';

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const [rows] = await db.query<RowDataPacket[]>('SELECT * FROM blog_posts WHERE id=? LIMIT 1', [id]);
  const post = rows[0];
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-blog:put:${ip}`, 60, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  if (typeof body.content === 'string') body.content = sanitizeHtml(body.content);
  if ('cover_image' in body) body.cover_image = sanitizeUrl(body.cover_image, 'image');
  if ('og_image' in body) body.og_image = sanitizeUrl(body.og_image, 'image');

  const fields = ['title', 'slug', 'excerpt', 'content', 'cover_image', 'meta_title', 'meta_description', 'focus_keyword', 'og_image', 'published'];
  const updates = Object.entries(body).filter(([key]) => fields.includes(key));
  if (!updates.length) return NextResponse.json({ error: 'No updatable fields were provided.' }, { status: 400 });

  if (body.published === 1) updates.push(['published_at', new Date().toISOString()]);

  const set = updates.map(([key]) => `${key}=?`).join(', ');
  const vals = [...updates.map(([, value]) => value), id];
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
