import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إعلانات المستخدم الحالي
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const items = await prisma.listing.findMany({
    where: { sellerId: auth.sub },
    include: {
      category: true,
      media: { orderBy: { order: 'asc' }, take: 1 },
      auction: { select: { id: true, status: true, endAt: true, startPrice: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return json({ items });
}
