import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// قائمة تقييمات مستخدم
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const reviews = await prisma.review.findMany({
    where: { targetId: params.id },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  const agg = await prisma.review.aggregate({
    where: { targetId: params.id },
    _avg: { rating: true, descMatch: true },
    _count: true,
  });
  return json({
    reviews,
    avgRating: agg._avg.rating ?? 0,
    avgDescMatch: agg._avg.descMatch ?? 0,
    count: agg._count,
  });
}

// إضافة تقييم لمستخدم
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول' }, 401);
  if (auth.sub === params.id) return json({ message: 'لا يمكنك تقييم نفسك' }, 400);

  const { rating, descMatch, comment, role } = await req.json();
  const r = Number(rating);
  if (!r || r < 1 || r > 5) return json({ message: 'التقييم بين 1 و 5' }, 400);

  await prisma.review.create({
    data: {
      authorId: auth.sub,
      targetId: params.id,
      role: (role as any) ?? 'SELLER',
      rating: r,
      descMatch: descMatch ? Number(descMatch) : null,
      comment: comment?.trim() || null,
    },
  });

  // تحديث درجة الثقة (متوسط التقييمات)
  const agg = await prisma.review.aggregate({
    where: { targetId: params.id },
    _avg: { rating: true },
  });
  await prisma.user.update({
    where: { id: params.id },
    data: { trustScore: agg._avg.rating ?? 0 },
  });

  return json({ ok: true });
}
