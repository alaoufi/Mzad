import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

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

  return json({ message });
}
