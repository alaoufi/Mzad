import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { packageByKey } from '@/lib/ads';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// طلب إعلان من معلن (خدمة ذاتية) — يبدأ بحالة PENDING بانتظار موافقة الإدارة
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'سجّل الدخول أولاً' }, 401);
  const b = await req.json();
  if (!b.title?.trim()) return json({ message: 'العنوان مطلوب' }, 400);
  const pkg = packageByKey(b.packageKey);
  if (!pkg) return json({ message: 'اختر باقة' }, 400);

  const created = await prisma.ad.create({
    data: {
      type: 'CLASSIFIED',
      title: b.title.trim(),
      imageUrl: b.imageUrl?.trim() || null,
      link: b.link?.trim() || null,
      placement: b.placement || 'HOME_TOP',
      status: 'PENDING',
      advertiser: b.advertiser?.trim() || auth.name || null,
      ownerId: auth.sub,
      targetCountries: b.targetCountries?.trim() || null,
      targetRegions: b.targetRegions?.trim() || null,
      packageKey: pkg.key,
      priceHalalas: pkg.priceHalalas,
      maxImpressions: pkg.maxImpressions,
      // المدة تبدأ عند موافقة الإدارة (تُضبط حينها)
    },
  });

  // إشعار جميع المشرفين بوصول طلب إعلان جديد
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    await Promise.all(admins.map((a) => notify(a.id, 'AD_REQUEST', `📣 طلب إعلان جديد: ${created.title}`, '/admin/ads')));
  } catch { /* تجاهل */ }

  return json({ id: created.id }, 201);
}
