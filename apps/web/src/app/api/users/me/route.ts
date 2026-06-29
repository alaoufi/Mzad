import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// الملف الشخصي للمستخدم الحالي مع إحصائيات الثقة
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    select: {
      id: true,
      name: true,
      role: true,
      accountType: true,
      city: true,
      region: true,
      isPhoneVerified: true,
      identityStatus: true,
      trustScore: true,
      createdAt: true,
      _count: { select: { listings: true, reviewsReceived: true } },
    },
  });
  if (!user) return json({ message: 'المستخدم غير موجود' }, 404);

  const reviews = await prisma.review.aggregate({
    where: { targetId: auth.sub },
    _avg: { rating: true, descMatch: true },
    _count: true,
  });

  return json({
    ...user,
    ratings: {
      avgRating: reviews._avg.rating ?? 0,
      avgDescMatch: reviews._avg.descMatch ?? 0,
      count: reviews._count,
    },
  });
}
