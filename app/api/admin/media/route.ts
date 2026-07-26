import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { readdir, stat, unlink } from 'fs/promises';
import { join, extname } from 'path';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { getUploadDir } from '@/lib/upload-dir';

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
    const uploadDir = getUploadDir();

    // 1. DB records — source of truth for metadata
    const [metaRows] = await db.query<RowDataPacket[]>(
      'SELECT filename, alt_text, title, caption, description, updated_at FROM media_meta ORDER BY updated_at DESC'
    );

    // 2. Filesystem scan — files that may not be in DB yet
    let fsFiles = new Set<string>();
    try {
      const entries = await readdir(uploadDir);
      for (const f of entries) {
        if (IMAGE_EXTS.has(extname(f).toLowerCase())) fsFiles.add(f);
      }
    } catch { /* UPLOAD_DIR not ready yet — skip */ }

    const dbFilenames = new Set(metaRows.map((r) => r.filename as string));

    // 3. Merge: DB rows + filesystem-only files
    const items = await Promise.all([
      // DB records (with optional disk stat)
      ...metaRows.map(async (m) => {
        let size = 0;
        let mtime: string = new Date(m.updated_at ?? Date.now()).toISOString();
        const onDisk = fsFiles.has(m.filename as string);
        if (onDisk) {
          try {
            const s = await stat(join(uploadDir, m.filename as string));
            size = s.size;
            mtime = s.mtime.toISOString();
          } catch { /* race condition — file removed between readdir and stat */ }
        }
        return {
          name:        m.filename as string,
          url:         `/uploads/${m.filename}`,
          size,
          mtime,
          onDisk,
          alt_text:    (m.alt_text    ?? '') as string,
          title:       (m.title       ?? '') as string,
          caption:     (m.caption     ?? '') as string,
          description: (m.description ?? '') as string,
        };
      }),
      // Filesystem-only files (uploaded but no DB record yet)
      ...[...fsFiles]
        .filter((f) => !dbFilenames.has(f))
        .map(async (f) => {
          const s = await stat(join(uploadDir, f));
          return {
            name:        f,
            url:         `/uploads/${f}`,
            size:        s.size,
            mtime:       s.mtime.toISOString(),
            onDisk:      true,
            alt_text:    '',
            title:       '',
            caption:     '',
            description: '',
          };
        }),
    ]);

    items.sort((a, b) => b.mtime.localeCompare(a.mtime));
    return NextResponse.json(items);
  } catch (err) {
    console.error('[media GET]', err);
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
       alt_text    = VALUES(alt_text),
       title       = VALUES(title),
       caption     = VALUES(caption),
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
  try {
    await unlink(join(getUploadDir(), name));
  } catch { /* file already gone — still clean DB */ }
  await db.query('DELETE FROM media_meta WHERE filename = ?', [name]).catch(() => null);
  return NextResponse.json({ ok: true });
}
