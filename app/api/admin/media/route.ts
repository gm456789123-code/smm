import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { readdir, stat, unlink } from 'fs/promises';
import { join, extname } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']);

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const files = await readdir(UPLOAD_DIR);
    const items = await Promise.all(
      files
        .filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()))
        .map(async f => {
          const s = await stat(join(UPLOAD_DIR, f));
          return { name: f, url: `/uploads/${f}`, size: s.size, mtime: s.mtime.toISOString() };
        })
    );
    items.sort((a, b) => b.mtime.localeCompare(a.mtime));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name } = await req.json();
  if (!name || name.includes('/') || name.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  await unlink(join(UPLOAD_DIR, name));
  return NextResponse.json({ ok: true });
}
