import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { isOpenEnd } from '@/lib/auction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إجراءات الدلال/المالك: بدء المزاد المجدول الآن، أو إلغاؤه
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const auction = await prisma.auction.findUnique({
    where: { id: params.id },
    include: { listing: { select: { sellerId: true } } },
  });
  if (!auction) return json({ message: 'غير موجود' }, 404);

  const allowed = auction.brokerId === auth.sub || auction.listing.sellerId === auth.sub || auth.role === 'ADMIN';
  if (!allowed) return json({ message: 'غير مصرّح' }, 403);

  const { action } = await req.json();
  if (action === 'start') {
    await prisma.auction.update({ where: { id: params.id }, data: { status: 'LIVE', startAt: new Date() } });
  } else if (action === 'cancel') {
    await prisma.auction.update({ where: { id: params.id }, data: { status: 'CANCELLED' } });
  } else {
    return json({ message: 'إجراء غير معروف' }, 400);
  }
  return json({ ok: true });
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auction = await prisma.auction.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { id: true, title: true, city: true, region: true } },
      type: { select: { name: true, icon: true, commissionPct: true, requiresDeposit: true } },
      bids: {
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { bidder: { select: { id: true, name: true } } },
      },
    },
  });
  if (!auction) return json({ message: 'المزاد غير موجود' }, 404);

  // دورة حياة تلقائية: مجدول ← مباشر عند موعد البداية، ومباشر ← منتهٍ عند النهاية
  let status = auction.status;
  const now = Date.now();
  if (status === 'SCHEDULED' && new Date(auction.startAt).getTime() <= now) {
    status = 'LIVE';
    await prisma.auction.update({ where: { id: auction.id }, data: { status: 'LIVE' } });
  }
  if (status === 'LIVE' && !isOpenEnd(auction.endAt) && new Date(auction.endAt).getTime() <= now) {
    status = 'ENDED';
    await prisma.auction.update({ where: { id: auction.id }, data: { status: 'ENDED' } });
  }

  const highest = auction.bids[0];
  return json({
    ...auction,
    status,
    highestBid: highest ? Number(highest.amount) : Number(auction.startPrice),
    bidCount: await prisma.bid.count({ where: { auctionId: params.id } }),
  });
}
