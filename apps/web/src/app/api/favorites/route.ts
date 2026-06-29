import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// قائمة المفضلة (إعلانات كاملة)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const favs = await prisma.favorite.findMany({
    where: { userId: auth.sub },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        include: {
          category: true,
          media: { orderBy: { order: 'asc' }, take: 1 },
          auction: { select: { id: true, status: true, endAt: true, startPrice: true } },
          seller: { select: { id: true, name: true, trustScore: true, identityStatus: true } },
        },
      },
    },
  });

  return json({ items: favs.map((f) => f.listing) });
}
