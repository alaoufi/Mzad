import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// محادثاتي الخاصة (كمشتري أو كبائع للإعلان)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const convs = await prisma.conversation.findMany({
    where: { isPublic: false, OR: [{ buyerId: auth.sub }, { listing: { sellerId: auth.sub } }] },
    include: {
      listing: { select: { id: true, title: true, sellerId: true, media: { take: 1, orderBy: { order: 'asc' } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  const otherIds = new Set<string>();
  for (const c of convs) {
    const otherId = c.listing.sellerId === auth.sub ? c.buyerId : c.listing.sellerId;
    if (otherId) otherIds.add(otherId);
  }
  const users = await prisma.user.findMany({ where: { id: { in: [...otherIds] } }, select: { id: true, name: true } });
  const nameOf = new Map(users.map((u) => [u.id, u.name]));

  const list = convs
    .map((c) => {
      const iAmSeller = c.listing.sellerId === auth.sub;
      const otherId = iAmSeller ? c.buyerId : c.listing.sellerId;
      const last = c.messages[0];
      return {
        id: c.id,
        listingId: c.listing.id,
        title: c.listing.title,
        image: c.listing.media[0]?.url ?? null,
        otherName: (otherId && nameOf.get(otherId)) || 'مستخدم',
        iAmSeller,
        lastMessage: last?.body ?? '',
        lastAt: last?.createdAt ?? c.createdAt,
      };
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return json({ conversations: list });
}
