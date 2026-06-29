import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// كل محادثات إعلان (عامة وخاصة) — لإدارة النزاعات
export async function GET(req: NextRequest, { params }: { params: { listingId: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const listing = await prisma.listing.findUnique({
    where: { id: params.listingId },
    select: { id: true, title: true, sellerId: true, seller: { select: { name: true } } },
  });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 404);

  const convs = await prisma.conversation.findMany({
    where: { listingId: params.listingId },
    include: { messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: 'asc' },
  });

  // أسماء المشترين في المحادثات الخاصة
  const buyerIds = convs.map((c) => c.buyerId).filter(Boolean) as string[];
  const buyers = await prisma.user.findMany({ where: { id: { in: buyerIds } }, select: { id: true, name: true } });
  const nameOf = new Map(buyers.map((u) => [u.id, u.name]));

  return json({
    listing: { id: listing.id, title: listing.title, sellerName: listing.seller?.name ?? '' },
    conversations: convs.map((c) => ({
      id: c.id,
      isPublic: c.isPublic,
      buyerName: c.buyerId ? (nameOf.get(c.buyerId) ?? 'مشتري') : null,
      messages: c.messages.map((m) => ({ id: m.id, senderName: m.sender.name, body: m.body, createdAt: m.createdAt })),
    })),
  });
}
