import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sanitizeHtml, sanitizeUrl } from '@/lib/sanitize-html';

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
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
  if (!title || !slug) return NextResponse.json({ error: 'title and slug are required.' }, { status: 400 });

  const safeContent = sanitizeHtml(content ?? '');
  const safeCoverImage = sanitizeUrl(cover_image, 'image');
  const safeOgImage = sanitizeUrl(og_image, 'image');
  const publishedAt = published ? new Date() : null;

  try {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO blog_posts (slug,title,excerpt,content,cover_image,meta_title,meta_description,focus_keyword,og_image,author_id,published,published_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        slug,
        title,
        excerpt ?? null,
        safeContent || null,
        safeCoverImage,
        meta_title ?? null,
        meta_description ?? null,
        focus_keyword ?? null,
        safeOgImage,
        admin.userId,
        published ?? 0,
        publishedAt,
      ]
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[blog POST]', msg);
    const isDupe = msg.includes('Duplicate entry');
    return NextResponse.json(
      { error: isDupe ? 'Slug นี้มีอยู่แล้ว กรุณาเปลี่ยน URL slug' : msg },
      { status: isDupe ? 409 : 500 }
    );
  }
}
