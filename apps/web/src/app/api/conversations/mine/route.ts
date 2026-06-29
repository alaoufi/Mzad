import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// محادثات المستخدم: الإعلانات التي راسل فيها (أو إعلاناته التي فيها رسائل)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  // المحادثات التي أرسل فيها المستخدم رسالة
  const sent = await prisma.message.findMany({
    where: { senderId: auth.sub },
    select: { conversationId: true },
    distinct: ['conversationId'],
  });
  // محادثات إعلاناته
  const ownConvs = await prisma.conversation.findMany({
    where: { listing: { sellerId: auth.sub } },
    select: { id: true },
  });

  const ids = Array.from(new Set([...sent.map((s) => s.conversationId), ...ownConvs.map((c) => c.id)]));
  if (ids.length === 0) return json({ conversations: [] });

  const convs = await prisma.conversation.findMany({
    where: { id: { in: ids } },
    include: {
      listing: {
        select: { id: true, title: true, media: { take: 1, orderBy: { order: 'asc' } } },
      },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  // ترتيب حسب آخر رسالة
  convs.sort((a, b) => {
    const ta = a.messages[0]?.createdAt ?? a.createdAt;
    const tb = b.messages[0]?.createdAt ?? b.createdAt;
    return new Date(tb).getTime() - new Date(ta).getTime();
  });

  return json({
    conversations: convs.map((c) => ({
      listingId: c.listing.id,
      title: c.listing.title,
      image: c.listing.media[0]?.url ?? null,
      lastMessage: c.messages[0]?.body ?? '',
      count: c._count.messages,
    })),
  });
}
