import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'];

// تحديث حالة النزاع وإضافة قرار الإدارة
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { status, resolution } = await req.json();
  const data: any = {};
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return json({ message: 'حالة غير صحيحة' }, 400);
    data.status = status;
  }
  if (resolution !== undefined) data.resolution = resolution?.trim() || null;
  if (Object.keys(data).length === 0) return json({ message: 'لا تغييرات' }, 400);

  const updated = await prisma.dispute.update({ where: { id: params.id }, data });

  if (status === 'RESOLVED' || status === 'REJECTED') {
    const msg = status === 'RESOLVED' ? '⚖️ تمّ حلّ نزاعك بقرار من الإدارة' : '⚖️ اطّلعت الإدارة على نزاعك';
    await notify(updated.openedById, 'DISPUTE', resolution ? `${msg}: ${resolution}` : msg, updated.listingId ? `/listings/${updated.listingId}` : '/disputes');
  }
  return json({ ok: true });
}
