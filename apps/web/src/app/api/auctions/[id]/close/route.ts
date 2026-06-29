import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { isInBrokerScope } from '@/lib/category-scope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إنهاء المزاد/المساومة (صاحب الإعلان أو الدلال أو الإدارة)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول' }, 401);

  const auction = await prisma.auction.findUnique({
    where: { id: params.id },
    include: { listing: { select: { sellerId: true, categoryId: true } } },
  });
  if (!auction) return json({ message: 'غير موجود' }, 404);

  const allowed = auction.listing.sellerId === auth.sub || auth.role === 'BROKER' || auth.role === 'ADMIN';
  if (!allowed) return json({ message: 'غير مصرّح' }, 403);

  if (auth.role === 'BROKER' && auction.listing.sellerId !== auth.sub) {
    const me = await prisma.user.findUnique({ where: { id: auth.sub }, select: { brokerCategories: true } });
    if (!(await isInBrokerScope(auction.listing.categoryId, me?.brokerCategories ?? []))) {
      return json({ message: 'هذا التصنيف خارج نطاقك المُسند كدلال' }, 403);
    }
  }

  await prisma.auction.update({ where: { id: params.id }, data: { status: 'ENDED' } });
  return json({ ok: true });
}
