import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

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
  const created = await prisma.ad.create({
    data: {
      type: b.type || 'HOUSE',
      title: b.title.trim(),
      imageUrl: b.imageUrl?.trim() || null,
      link: b.link?.trim() || null,
      placement: b.placement || 'HOME_TOP',
      status: b.status || 'ACTIVE',
      priority: Number(b.priority) || 0,
      advertiser: b.advertiser?.trim() || null,
    },
  });
  return json({ id: created.id }, 201);
}
