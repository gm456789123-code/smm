import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

async function requireAdmin(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const txId = Number(id);
  if (!txId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, user_id, tx_status, ref FROM transactions WHERE id = ? AND tx_type = 'angpao'`,
    [txId]
  );
  const tx = rows[0];
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (tx.tx_status !== 'pending') {
    return NextResponse.json({ error: 'Transaction is not pending' }, { status: 409 });
  }

  if (action === 'approve') {
    const amount = Number(body.amount);
    if (!amount || amount <= 0 || amount > 5000) {
      return NextResponse.json({ error: 'amount ต้องอยู่ระหว่าง 1–5000' }, { status: 400 });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `UPDATE transactions SET tx_status = 'completed', amount = ?, note = CONCAT(note, ' | อนุมัติโดย admin ฿${amount}') WHERE id = ?`,
        [amount, txId]
      );
      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, tx.user_id]);
      await conn.commit();
      return NextResponse.json({ success: true, amount });
    } catch (err) {
      await conn.rollback();
      console.error('[angpao/approve]', err);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    } finally {
      conn.release();
    }
  }

  if (action === 'reject') {
    await db.query(
      `UPDATE transactions SET tx_status = 'cancelled', note = CONCAT(note, ' | ปฏิเสธโดย admin') WHERE id = ?`,
      [txId]
    );
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'action ต้องเป็น approve หรือ reject' }, { status: 400 });
}
