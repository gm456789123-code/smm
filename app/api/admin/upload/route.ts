import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'ไฟล์ต้องเป็นรูปภาพ (jpg, png, gif, webp, svg)' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' }, { status: 400 });
  }

  const ext = extname(file.name) || '.jpg';
  const name = `${randomUUID()}${ext}`;
  const dir = join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/${name}` });
}
