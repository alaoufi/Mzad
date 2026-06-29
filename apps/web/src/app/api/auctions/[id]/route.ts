import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auction = await prisma.auction.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { id: true, title: true, city: true, region: true } },
      bids: {
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: { bidder: { select: { id: true, name: true } } },
      },
    },
  });
  if (!auction) return json({ message: 'المزاد غير موجود' }, 404);

  const highest = auction.bids[0];
  return json({
    ...auction,
    highestBid: highest ? Number(highest.amount) : Number(auction.startPrice),
    bidCount: await prisma.bid.count({ where: { auctionId: params.id } }),
  });
}
