import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// فتح/إنشاء محادثة خاصة مع بائع إعلان
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول للمراسلة' }, 401);

  const { listingId } = await req.json();
  if (!listingId) return json({ message: 'الإعلان مطلوب' }, 400);

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 404);
  if (listing.sellerId === auth.sub) return json({ message: 'لا يمكنك مراسلة نفسك' }, 400);

  let conv = await prisma.conversation.findFirst({
    where: { listingId, buyerId: auth.sub, isPublic: false },
  });
  if (!conv) {
    conv = await prisma.conversation.create({ data: { listingId, buyerId: auth.sub, isPublic: false } });
  }
  return json({ id: conv.id });
}
