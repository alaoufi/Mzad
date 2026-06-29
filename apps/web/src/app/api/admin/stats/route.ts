import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'هذه الصفحة للإدارة فقط' }, 403);

  const [users, listings, activeListings, auctions, bids, reports, recent, openReports] =
    await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.auction.count(),
      prisma.bid.count(),
      prisma.report.count(),
      prisma.listing.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          title: true,
          city: true,
          saleType: true,
          status: true,
          seller: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
      prisma.report.findMany({
        where: { status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

  return json({
    stats: { users, listings, activeListings, auctions, bids, reports },
    recent,
    openReports,
  });
}
