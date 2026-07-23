import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

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

  if (action === 'approve') {
    const amount = Number(body.amount);
    if (!amount || amount <= 0 || amount > 5000) {
      return NextResponse.json({ error: 'amount ต้องอยู่ระหว่าง 1–5000' }, { status: 400 });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Lock row so two admins cannot approve the same pending voucher
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, user_id, tx_status, ref FROM transactions
         WHERE id = ? AND tx_type = 'angpao' FOR UPDATE`,
        [txId]
      );
      const tx = rows[0];
      if (!tx) {
        await conn.rollback();
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (tx.tx_status !== 'pending') {
        await conn.rollback();
        return NextResponse.json({ error: 'Transaction is not pending' }, { status: 409 });
      }

      const [upd] = await conn.query<ResultSetHeader>(
        `UPDATE transactions
         SET tx_status = 'completed',
             amount = ?,
             note = CONCAT(IFNULL(note,''), ' | อนุมัติโดย admin ฿', ?)
         WHERE id = ? AND tx_status = 'pending'`,
        [amount, String(amount), txId]
      );
      if (upd.affectedRows === 0) {
        await conn.rollback();
        return NextResponse.json({ error: 'Transaction is not pending' }, { status: 409 });
      }

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
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id, tx_status FROM transactions
         WHERE id = ? AND tx_type = 'angpao' FOR UPDATE`,
        [txId]
      );
      const tx = rows[0];
      if (!tx) {
        await conn.rollback();
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      if (tx.tx_status !== 'pending') {
        await conn.rollback();
        return NextResponse.json({ error: 'Transaction is not pending' }, { status: 409 });
      }

      await conn.query(
        `UPDATE transactions
         SET tx_status = 'cancelled',
             note = CONCAT(IFNULL(note,''), ' | ปฏิเสธโดย admin')
         WHERE id = ? AND tx_status = 'pending'`,
        [txId]
      );
      await conn.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await conn.rollback();
      console.error('[angpao/reject]', err);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    } finally {
      conn.release();
    }
  }

  return NextResponse.json({ error: 'action ต้องเป็น approve หรือ reject' }, { status: 400 });
}
