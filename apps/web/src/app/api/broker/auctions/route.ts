import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// مزادات الدلال (التي يديرها) — للدلال أو الإدارة
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'BROKER' && auth.role !== 'ADMIN') return json({ message: 'هذه الصفحة للدلالين' }, 403);

  const where = auth.role === 'ADMIN' ? {} : { brokerId: auth.sub };
  const auctions = await prisma.auction.findMany({
    where,
    orderBy: [{ status: 'asc' }, { startAt: 'asc' }],
    take: 60,
    include: {
      listing: { select: { id: true, title: true, city: true, media: { take: 1, orderBy: { order: 'asc' } } } },
      _count: { select: { bids: true } },
    },
  });

  return json({
    auctions: auctions.map((a) => ({
      id: a.id,
      listingId: a.listing.id,
      title: a.listing.title,
      city: a.listing.city,
      image: a.listing.media[0]?.url ?? null,
      status: a.status,
      startAt: a.startAt,
      endAt: a.endAt,
      startPrice: a.startPrice,
      bids: a._count.bids,
    })),
  });
}
