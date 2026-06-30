import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { packageByKey } from '@/lib/ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تفاصيل إعلان + إحصاؤه اليومي (للوحة الإحصائيات)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  const ad = await prisma.ad.findUnique({ where: { id: params.id } });
  if (!ad) return json({ message: 'غير موجود' }, 404);
  const stats = await prisma.adStat.findMany({ where: { adId: params.id }, orderBy: { day: 'asc' } });
  return json({ ad, stats });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  const b = await req.json();
  const pkg = b.packageKey !== undefined ? packageByKey(b.packageKey) : undefined;
  await prisma.ad.update({
    where: { id: params.id },
    data: {
      ...(b.title?.trim() ? { title: b.title.trim() } : {}),
      ...(b.imageUrl !== undefined ? { imageUrl: b.imageUrl?.trim() || null } : {}),
      ...(b.link !== undefined ? { link: b.link?.trim() || null } : {}),
      ...(b.placement ? { placement: b.placement } : {}),
      ...(b.status ? { status: b.status } : {}),
      ...(b.priority !== undefined ? { priority: Number(b.priority) || 0 } : {}),
      ...(b.advertiser !== undefined ? { advertiser: b.advertiser?.trim() || null } : {}),
      ...(b.targetCountries !== undefined ? { targetCountries: b.targetCountries?.trim() || null } : {}),
      ...(b.targetRegions !== undefined ? { targetRegions: b.targetRegions?.trim() || null } : {}),
      ...(b.targetCategories !== undefined ? { targetCategories: b.targetCategories?.trim() || null } : {}),
      ...(b.maxImpressions !== undefined ? { maxImpressions: b.maxImpressions === null || b.maxImpressions === '' ? null : Number(b.maxImpressions) } : {}),
      ...(b.startAt !== undefined ? { startAt: b.startAt ? new Date(b.startAt) : null } : {}),
      ...(b.endAt !== undefined ? { endAt: b.endAt ? new Date(b.endAt) : null } : {}),
      ...(b.packageKey !== undefined ? {
        packageKey: b.packageKey || null,
        ...(pkg ? { priceHalalas: pkg.priceHalalas, maxImpressions: pkg.maxImpressions } : {}),
      } : {}),
    },
  });
  return json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  await prisma.adStat.deleteMany({ where: { adId: params.id } }).catch(() => {});
  await prisma.ad.delete({ where: { id: params.id } });
  return json({ ok: true });
}
