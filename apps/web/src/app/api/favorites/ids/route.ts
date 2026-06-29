import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// معرّفات الإعلانات المفضّلة للمستخدم (لحالة القلب في البطاقات)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ ids: [] });
  const favs = await prisma.favorite.findMany({
    where: { userId: auth.sub },
    select: { listingId: true },
  });
  return json({ ids: favs.map((f) => f.listingId) });
}
