import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'هذه الصفحة للإدارة فقط' }, 403);

  const listingSelect = {
    id: true,
    title: true,
    city: true,
    saleType: true,
    status: true,
    seller: { select: { name: true } },
    category: { select: { name: true, parent: { select: { name: true } } } },
  } as const;

  const [users, listings, activeListings, pending, auctions, bids, reports, recent, pendingList, usersList, openReports] =
    await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.listing.count({ where: { status: 'DRAFT' } }),
      prisma.auction.count(),
      prisma.bid.count(),
      prisma.report.count(),
      prisma.listing.findMany({ orderBy: { createdAt: 'desc' }, take: 15, select: listingSelect }),
      prisma.listing.findMany({ where: { status: 'DRAFT' }, orderBy: { createdAt: 'desc' }, take: 30, select: listingSelect }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, name: true, phone: true, role: true, trustScore: true, city: true },
      }),
      prisma.report.findMany({ where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

  return json({
    stats: { users, listings, activeListings, pending, auctions, bids, reports },
    recent,
    pendingList,
    usersList,
    openReports,
  });
}
