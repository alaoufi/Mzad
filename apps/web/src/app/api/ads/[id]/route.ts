import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// عرض إعلان واحد (عام) لصفحة عرض الإعلان
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ad = await prisma.ad.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, imageUrl: true, link: true, advertiser: true, placement: true, createdAt: true },
    });
    if (!ad) return json({ message: 'الإعلان غير موجود' }, 404);
    return json({ ad });
  } catch {
    return json({ message: 'تعذّر جلب الإعلان' }, 500);
  }
}
