import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT id,tx_type,amount,ref,tx_status,note,created_at FROM transactions WHERE user_id=? ORDER BY created_at DESC',
    [user.userId]
  );
  return NextResponse.json(rows);
}
