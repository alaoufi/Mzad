import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadConv(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: { listing: { select: { id: true, title: true, sellerId: true } } },
  });
}

function participant(conv: any, uid: string) {
  return conv && (conv.buyerId === uid || conv.listing.sellerId === uid);
}

// رسائل المحادثة + معلومات الطرف الآخر
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  const conv = await loadConv(params.id);
  if (!conv) return json({ message: 'غير موجودة' }, 404);
  if (!participant(conv, auth.sub)) return json({ message: 'غير مصرّح' }, 403);

  const iAmSeller = conv.listing.sellerId === auth.sub;
  const otherId = iAmSeller ? conv.buyerId : conv.listing.sellerId;
  const other = otherId ? await prisma.user.findUnique({ where: { id: otherId }, select: { name: true } }) : null;

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  return json({
    listing: { id: conv.listing.id, title: conv.listing.title },
    otherName: other?.name ?? 'مستخدم',
    me: auth.sub,
    messages,
  });
}

// إرسال رسالة خاصة
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول' }, 401);
  const conv = await loadConv(params.id);
  if (!conv) return json({ message: 'غير موجودة' }, 404);
  if (!participant(conv, auth.sub)) return json({ message: 'غير مصرّح' }, 403);

  const { body } = await req.json();
  if (!body?.trim()) return json({ message: 'الرسالة فارغة' }, 400);

  const message = await prisma.message.create({
    data: { conversationId: params.id, senderId: auth.sub, type: 'TEXT', body: body.trim() },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });

  // إشعار الطرف الآخر
  const otherId = conv.listing.sellerId === auth.sub ? conv.buyerId : conv.listing.sellerId;
  const me = await prisma.user.findUnique({ where: { id: auth.sub }, select: { name: true } });
  if (otherId) await notify(otherId, 'MESSAGE', `💬 رسالة من ${me?.name ?? 'مستخدم'}: ${body.trim().slice(0, 40)}`, `/messages/${params.id}`);

  return json({ message });
}
