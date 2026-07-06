import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

async function checkAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-blog:get:${ip}`, 120, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id,slug,title,published,published_at,created_at FROM blog_posts ORDER BY created_at DESC'
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`admin-blog:post:${ip}`, 40, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, slug, excerpt, content, cover_image, meta_title, meta_description, focus_keyword, og_image, published } = await req.json();
  if (!title || !slug) return NextResponse.json({ error: 'title และ slug จำเป็น' }, { status: 400 });

  const publishedAt = published ? new Date() : null;
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO blog_posts (slug,title,excerpt,content,cover_image,meta_title,meta_description,focus_keyword,og_image,author_id,published,published_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug, title, excerpt ?? null, content ?? null, cover_image ?? null,
     meta_title ?? null, meta_description ?? null, focus_keyword ?? null, og_image ?? null,
     admin.userId, published ?? 0, publishedAt]
  );
  return NextResponse.json({ id: result.insertId }, { status: 201 });
}
