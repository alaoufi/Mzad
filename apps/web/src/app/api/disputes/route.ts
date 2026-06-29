import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// نزاعاتي
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  try {
    const disputes = await prisma.dispute.findMany({
      where: { openedById: auth.sub },
      orderBy: { createdAt: 'desc' },
      include: { listing: { select: { id: true, title: true } } },
    });
    return json({ disputes });
  } catch {
    return json({ disputes: [] });
  }
}

// فتح نزاع جديد
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول' }, 401);

  const { listingId, reason, detail } = await req.json();
  if (!reason?.trim()) return json({ message: 'سبب النزاع مطلوب' }, 400);

  let againstId: string | null = null;
  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
    if (listing) againstId = listing.sellerId;
    if (againstId === auth.sub) againstId = null; // لا نزاع مع النفس
  }

  await prisma.dispute.create({
    data: {
      openedById: auth.sub,
      listingId: listingId || null,
      againstId,
      reason: reason.trim(),
      detail: detail?.trim() || null,
    },
  });
  return json({ ok: true }, 201);
}
