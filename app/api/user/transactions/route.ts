import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id,tx_type,amount,ref,tx_status,note,created_at FROM transactions WHERE user_id=? ORDER BY created_at DESC',
    [user.userId]
  );
  return NextResponse.json(rows);
}
