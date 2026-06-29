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
      interests: true,
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

// تحديث الملف الشخصي + طلب توثيق الهوية
export async function PATCH(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const { name, city, region, requestVerification, interests } = await req.json();
  const data: any = {};
  if (typeof name === 'string' && name.trim()) data.name = name.trim();
  if (city !== undefined) data.city = city || null;
  if (region !== undefined) data.region = region || null;
  if (Array.isArray(interests)) data.interests = interests.filter((x: any) => typeof x === 'string').slice(0, 50);

  if (requestVerification) {
    const current = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: { identityStatus: true },
    });
    if (current?.identityStatus === 'VERIFIED') {
      return json({ message: 'حسابك موثّق بالفعل' }, 400);
    }
    data.identityStatus = 'PENDING';
  }

  await prisma.user.update({ where: { id: auth.sub }, data });
  return json({ ok: true });
}
