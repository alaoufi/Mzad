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
    select: { id: true, senderId: true, type: true, body: true, mediaUrl: true, transcript: true, createdAt: true },
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

  const { body, type, mediaUrl, transcript } = await req.json();
  const kind: 'TEXT' | 'IMAGE' | 'VOICE' = type === 'IMAGE' || type === 'VOICE' ? type : 'TEXT';
  const cleanBody = (body ?? '').toString().trim();
  const cleanTranscript = (transcript ?? '').toString().trim() || null;

  // نص يتطلّب جسماً؛ الوسائط تتطلّب رابطاً
  if (kind === 'TEXT' && !cleanBody) return json({ message: 'الرسالة فارغة' }, 400);
  if ((kind === 'IMAGE' || kind === 'VOICE') && !mediaUrl) return json({ message: 'لا يوجد ملف' }, 400);

  const storedBody = kind === 'TEXT' ? cleanBody : (cleanBody || cleanTranscript || '');

  const message = await prisma.message.create({
    data: {
      conversationId: params.id, senderId: auth.sub, type: kind,
      body: storedBody, mediaUrl: mediaUrl ?? null, transcript: cleanTranscript,
    },
    select: { id: true, senderId: true, type: true, body: true, mediaUrl: true, transcript: true, createdAt: true },
  });

  // إشعار الطرف الآخر
  const otherId = conv.listing.sellerId === auth.sub ? conv.buyerId : conv.listing.sellerId;
  const me = await prisma.user.findUnique({ where: { id: auth.sub }, select: { name: true } });
  const preview = kind === 'IMAGE' ? '📷 صورة' : kind === 'VOICE' ? `🎤 رسالة صوتية${cleanTranscript ? `: ${cleanTranscript.slice(0, 30)}` : ''}` : storedBody.slice(0, 40);
  if (otherId) await notify(otherId, 'MESSAGE', `💬 رسالة من ${me?.name ?? 'مستخدم'}: ${preview}`, `/messages/${params.id}`);

  return json({ message });
}
