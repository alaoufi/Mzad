import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { packageByKey } from '@/lib/ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  try {
    const ads = await prisma.ad.findMany({ orderBy: { createdAt: 'desc' } });
    return json({ ads });
  } catch {
    return json({ message: 'الجدول غير مهيّأ بعد (لم يُطبّق التعديل على قاعدة البيانات).' }, 503);
  }
}

export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  const b = await req.json();
  if (!b.title?.trim()) return json({ message: 'العنوان مطلوب' }, 400);

  // الباقة تحدّد المدة والسقف والسعر (أيهما أوّل: المدة أو المشاهدات)
  const pkg = packageByKey(b.packageKey);
  const now = new Date();
  const startAt = b.startAt ? new Date(b.startAt) : now;
  const endAt = b.endAt ? new Date(b.endAt) : (pkg ? new Date(now.getTime() + pkg.days * 86400000) : null);
  const maxImpressions = b.maxImpressions != null ? Number(b.maxImpressions) : (pkg ? pkg.maxImpressions : null);

  const created = await prisma.ad.create({
    data: {
      type: b.type || 'CLASSIFIED',
      title: b.title.trim(),
      imageUrl: b.imageUrl?.trim() || null,
      link: b.link?.trim() || null,
      placement: b.placement || 'HOME_TOP',
      status: b.status || 'ACTIVE',
      priority: Number(b.priority) || 0,
      advertiser: b.advertiser?.trim() || null,
      ownerId: b.ownerId || null,
      targetCountries: b.targetCountries?.trim() || null,
      targetRegions: b.targetRegions?.trim() || null,
      targetCategories: b.targetCategories?.trim() || null,
      packageKey: b.packageKey || null,
      priceHalalas: pkg ? pkg.priceHalalas : (b.priceHalalas != null ? Number(b.priceHalalas) : null),
      maxImpressions,
      startAt, endAt,
    },
  });
  return json({ id: created.id }, 201);
}
