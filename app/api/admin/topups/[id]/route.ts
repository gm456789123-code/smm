import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/lib/auth';
import { approvePendingTx, rejectPendingTx } from '@/lib/credit-topup';

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
    if (!amount || amount <= 0 || amount > 1_000_000) {
      return NextResponse.json({ error: 'amount ต้องมากกว่า 0' }, { status: 400 });
    }

    const result = await approvePendingTx({
      txId,
      txType: 'topup',
      amount,
      approvalNote: ` | อนุมัติโดยแอดมิน ฿${amount}`,
      referral: true,
      bonus: true,
    });

    if (result.status === 'not_found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (result.status === 'not_pending') return NextResponse.json({ error: 'Transaction is not pending' }, { status: 409 });
    if (result.status === 'error') return NextResponse.json({ error: result.message }, { status: 500 });

    return NextResponse.json({ success: true, amount: result.amount });
  }

  if (action === 'reject') {
    const result = await rejectPendingTx({
      txId,
      txType: 'topup',
      rejectionNote: ' | ปฏิเสธโดยแอดมิน',
    });

    if (result.status === 'not_found') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (result.status === 'not_pending') return NextResponse.json({ error: 'Transaction is not pending' }, { status: 409 });
    if (result.status === 'error') return NextResponse.json({ error: result.message }, { status: 500 });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'action ต้องเป็น approve หรือ reject' }, { status: 400 });
}
