import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تبديل المفضلة (إضافة/إزالة)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'سجّل الدخول لإضافة المفضلة' }, 401);

  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: auth.sub, listingId: params.id } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return json({ favorited: false });
  }
  await prisma.favorite.create({ data: { userId: auth.sub, listingId: params.id } });
  return json({ favorited: true });
}
