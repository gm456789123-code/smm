import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { readdir, stat, unlink } from 'fs/promises';
import { join, extname } from 'path';
import db from '@/lib/db';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']);

async function checkAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS media_meta (
      filename     VARCHAR(255) NOT NULL PRIMARY KEY,
      alt_text     TEXT,
      title        VARCHAR(500),
      caption      TEXT,
      description  TEXT,
      updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function GET(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await ensureTable();
    const files = await readdir(UPLOAD_DIR);

    // Fetch all metadata in one query
    const names = files.filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()));
    const [metaRows] = await db.query<RowDataPacket[]>(
      names.length
        ? `SELECT filename, alt_text, title, caption, description FROM media_meta WHERE filename IN (${names.map(() => '?').join(',')})`
        : 'SELECT filename, alt_text, title, caption, description FROM media_meta WHERE 1=0',
      names
    );
    const metaMap = Object.fromEntries(metaRows.map(r => [r.filename as string, r]));

    const items = await Promise.all(
      names.map(async f => {
        const s = await stat(join(UPLOAD_DIR, f));
        const m = metaMap[f];
        return {
          name:        f,
          url:         `/uploads/${f}`,
          size:        s.size,
          mtime:       s.mtime.toISOString(),
          alt_text:    m?.alt_text    ?? '',
          title:       m?.title       ?? '',
          caption:     m?.caption     ?? '',
          description: m?.description ?? '',
        };
      })
    );
    items.sort((a, b) => b.mtime.localeCompare(a.mtime));
    return NextResponse.json(items);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PUT(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name, alt_text, title, caption, description } = await req.json();
  if (!name || name.includes('/') || name.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  await ensureTable();
  await db.query(
    `INSERT INTO media_meta (filename, alt_text, title, caption, description)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       alt_text = VALUES(alt_text),
       title = VALUES(title),
       caption = VALUES(caption),
       description = VALUES(description)`,
    [name, alt_text ?? '', title ?? '', caption ?? '', description ?? '']
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { name } = await req.json();
  if (!name || name.includes('/') || name.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  await unlink(join(UPLOAD_DIR, name));
  await db.query('DELETE FROM media_meta WHERE filename = ?', [name]).catch(() => null);
  return NextResponse.json({ ok: true });
}
