import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// قائمة المستخدمين للإدارة — بحث بالاسم/الجوال + إحصاء إعلانات كل مستخدم
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
  const where = q
    ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { phone: { contains: q } }] }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, name: true, phone: true, role: true, accountType: true,
      identityStatus: true, active: true, city: true, region: true,
      bio: true, experienceYears: true, bankName: true, bankAccount: true, iban: true,
      trustScore: true, createdAt: true,
      _count: { select: { listings: true, bids: true } },
    },
  });
  return json({ users });
}
