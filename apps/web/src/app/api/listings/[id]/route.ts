import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      category: { include: { parent: true } },
      media: { orderBy: { order: 'asc' } },
      health: true,
      seller: {
        select: { id: true, name: true, trustScore: true, identityStatus: true, city: true, region: true },
      },
      auction: { include: { bids: { orderBy: { amount: 'desc' }, take: 10 } } },
    },
  });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 404);
  return json(listing);
}
