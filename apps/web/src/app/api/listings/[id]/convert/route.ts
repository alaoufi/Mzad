import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { OPEN_END_ISO } from '@/lib/auction';
import { isInBrokerScope } from '@/lib/category-scope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * تحويل نوع البيع: عرض بسعر (DIRECT) ↔ مزاد مؤقّت (AUCTION) ↔ على السوم (ONSOOM).
 * يُسمح به لصاحب الإعلان أو الدلال أو الإدارة.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول' }, 401);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { auction: true },
  });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 404);

  const allowed = listing.sellerId === auth.sub || auth.role === 'BROKER' || auth.role === 'ADMIN';
  if (!allowed) return json({ message: 'غير مصرّح بتحويل هذا الإعلان' }, 403);

  // الدلال (وليس المالك ولا الإدارة) مقيّد بنطاقه المُسند وبتفعيل حسابه
  if (auth.role === 'BROKER' && listing.sellerId !== auth.sub) {
    const me = await prisma.user.findUnique({ where: { id: auth.sub }, select: { brokerCategories: true, active: true } });
    if (me && me.active === false) return json({ message: 'حسابك كدلال معطّل حالياً' }, 403);
    if (!(await isInBrokerScope(listing.categoryId, me?.brokerCategories ?? []))) {
      return json({ message: 'هذا التصنيف خارج نطاقك المُسند كدلال' }, 403);
    }
  }

  const body = await req.json();
  const to = body.to as 'DIRECT' | 'AUCTION' | 'ONSOOM';
  const now = new Date();

  if (to === 'DIRECT') {
    // عرض بسعر ثابت — إزالة أي مزاد قائم
    if (listing.auction) await prisma.auction.delete({ where: { id: listing.auction.id } });
    await prisma.listing.update({
      where: { id: listing.id },
      data: { saleType: 'DIRECT', price: body.price != null ? new Prisma.Decimal(body.price) : null },
    });
    return json({ ok: true, mode: 'DIRECT' });
  }

  // AUCTION (مؤقّت) أو ONSOOM (مفتوح بلا وقت)
  const isOpen = to === 'ONSOOM';
  const endAt = isOpen ? new Date(OPEN_END_ISO) : new Date(now.getTime() + (Number(body.durationHours) || 24) * 3600_000);
  const startPrice = new Prisma.Decimal(body.startPrice ?? listing.price ?? 0);
  const minIncrement = new Prisma.Decimal(body.minIncrement ?? 100);

  await prisma.auction.upsert({
    where: { listingId: listing.id },
    create: { listingId: listing.id, startPrice, minIncrement, startAt: now, endAt, status: 'LIVE', typeId: body.typeId || null },
    update: {
      endAt, status: 'LIVE',
      ...(body.startPrice != null ? { startPrice } : {}),
      ...(body.minIncrement != null ? { minIncrement } : {}),
      ...(body.typeId !== undefined ? { typeId: body.typeId || null } : {}),
    },
  });

  // المزاد المؤقّت saleType=AUCTION (تبويب المزادات)، وعلى السوم يبقى DIRECT (تبويب العروض)
  await prisma.listing.update({
    where: { id: listing.id },
    data: { saleType: isOpen ? 'DIRECT' : 'AUCTION', ...(isOpen ? { price: null } : {}) },
  });

  return json({ ok: true, mode: to });
}
