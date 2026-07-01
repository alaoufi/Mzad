import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'];

const UFULL = {
  id: true, name: true, phone: true, city: true, region: true, identityStatus: true,
  accountType: true, trustScore: true, bio: true, experienceYears: true,
  bankName: true, bankAccount: true, iban: true, createdAt: true,
} as const;

// ملفّ النزاع الكامل للإدارة — بيانات الطرفين + سوابقهما + الأدلّة
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const d = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { id: true, title: true, price: true, saleType: true, city: true, region: true, category: { select: { name: true, parent: { select: { name: true } } } } } },
      openedBy: { select: UFULL, },
    },
  });
  if (!d) return json({ message: 'النزاع غير موجود' }, 404);

  const against = d.againstId ? await prisma.user.findUnique({ where: { id: d.againstId }, select: UFULL }) : null;

  // سوابق النزاعات لكل طرف (فتحها / رُفعت ضدّه)
  const history = async (uid?: string | null) => {
    if (!uid) return { opened: 0, against: 0 };
    const [opened, ag] = await Promise.all([
      prisma.dispute.count({ where: { openedById: uid } }),
      prisma.dispute.count({ where: { againstId: uid } }),
    ]);
    return { opened, against: ag };
  };
  const [openerHistory, againstHistory] = await Promise.all([history(d.openedById), history(d.againstId)]);

  return json({ dispute: d, against, openerHistory, againstHistory });
}

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
