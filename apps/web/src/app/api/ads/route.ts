import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إعلان عام لموضع معيّن (للمكوّن AdBanner). متسامح: يعيد null إن لم يتهيّأ الجدول.
export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement') ?? 'HOME_TOP';
  try {
    const ad = await prisma.ad.findFirst({
      where: { placement, status: 'ACTIVE' },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    if (ad) {
      // تسجيل ظهور (best-effort)
      prisma.ad.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } }).catch(() => {});
    }
    return json({ ad });
  } catch {
    return json({ ad: null });
  }
}
