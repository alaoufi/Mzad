import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getOrCreateConversation(listingId: string) {
  let conv = await prisma.conversation.findFirst({ where: { listingId, isPublic: true } });
  if (!conv) {
    conv = await prisma.conversation.create({ data: { listingId, isPublic: true } });
  }
  return conv;
}

// رسائل الإعلان (محادثة عامة)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const conv = await prisma.conversation.findFirst({
    where: { listingId: params.id, isPublic: true },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 100,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  return json({ messages: conv?.messages ?? [] });
}

// إرسال رسالة
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول للمراسلة' }, 401);

  const { body } = await req.json();
  if (!body?.trim()) return json({ message: 'الرسالة فارغة' }, 400);

  const conv = await getOrCreateConversation(params.id);
  const message = await prisma.message.create({
    data: { conversationId: conv.id, senderId: auth.sub, type: 'TEXT', body: body.trim() },
    include: { sender: { select: { id: true, name: true } } },
  });

  // إشعار صاحب الإعلان برسالة جديدة (إن لم يكن هو المُرسِل)
  const listing = await prisma.listing.findUnique({ where: { id: params.id }, select: { sellerId: true, title: true } });
  if (listing && listing.sellerId !== auth.sub) {
    await notify(listing.sellerId, 'MESSAGE', `💬 رسالة جديدة من ${message.sender.name} على إعلانك «${listing.title}»`, `/listings/${params.id}`);
  }

  return json({ message });
}
