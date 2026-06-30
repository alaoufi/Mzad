import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تسجيل ظهور/نقرة لإعلان + إحصاء يومي + إيقاف تلقائي عند بلوغ سقف المشاهدات
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let type = 'IMPRESSION';
  try { type = (await req.json())?.type ?? 'IMPRESSION'; } catch {}
  const isClick = type === 'CLICK';
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  try {
    const ad = await prisma.ad.update({
      where: { id: params.id },
      data: isClick ? { clicks: { increment: 1 } } : { impressions: { increment: 1 } },
      select: { impressions: true, maxImpressions: true, status: true },
    });

    // الإحصاء اليومي (upsert)
    await prisma.adStat.upsert({
      where: { adId_day: { adId: params.id, day } },
      create: { adId: params.id, day, impressions: isClick ? 0 : 1, clicks: isClick ? 1 : 0 },
      update: isClick ? { clicks: { increment: 1 } } : { impressions: { increment: 1 } },
    }).catch(() => {});

    // إيقاف تلقائي عند بلوغ سقف المشاهدات
    if (!isClick && ad.maxImpressions != null && ad.impressions >= ad.maxImpressions && ad.status === 'ACTIVE') {
      await prisma.ad.update({ where: { id: params.id }, data: { status: 'EXPIRED' } }).catch(() => {});
    }
    return json({ ok: true });
  } catch {
    return json({ ok: false });
  }
}
