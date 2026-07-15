import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function requireAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  return user?.role === 'admin' ? user : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const delta = Number(body.amount);
  if (isNaN(delta) || delta === 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[user]] = await conn.query<RowDataPacket[]>('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      await conn.rollback();
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [delta, id]);
    await conn.query(
      `INSERT INTO transactions (user_id, tx_type, amount, tx_status, note)
       VALUES (?, 'adjust', ?, 'completed', ?)`,
      [id, Math.abs(delta), body.note || (delta > 0 ? 'เติมเครดิตโดย Admin' : 'หักเครดิตโดย Admin')]
    );
    await conn.commit();
    return NextResponse.json({ ok: true });
  } catch {
    await conn.rollback();
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  } finally {
    conn.release();
  }
}
