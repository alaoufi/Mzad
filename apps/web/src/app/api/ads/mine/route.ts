import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إعلانات المعلن نفسه + إحصاؤها
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'سجّل الدخول أولاً' }, 401);
  try {
    const ads = await prisma.ad.findMany({ where: { ownerId: auth.sub }, orderBy: { createdAt: 'desc' } });
    return json({ ads });
  } catch {
    return json({ ads: [] });
  }
}
