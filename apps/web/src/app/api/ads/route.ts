import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';
import { regionMatches } from '@/lib/ads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إعلانات موضع معيّن (للتبادل في AdBanner) — مع استهداف جغرافي بالـIP وسقف مشاهدات/مدة
export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement') ?? 'HOME_TOP';
  // بلد ومدينة الزائر من ترويسات Vercel (إن توفّرت)
  const country = (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
  const city = req.headers.get('x-vercel-ip-city') || '';
  const now = new Date();
  try {
    const rows = await prisma.ad.findMany({
      where: {
        placement,
        status: 'ACTIVE',
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });

    const eligible = rows.filter((a) => {
      // سقف المشاهدات (أيهما أوّل مع المدة)
      if (a.maxImpressions != null && a.impressions >= a.maxImpressions) return false;
      // الاستهداف الجغرافي: فارغ = كل الدول
      const tc = (a.targetCountries || '').trim();
      if (tc && country) {
        const list = tc.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
        if (list.length && !list.includes(country)) return false;
      }
      // الاستهداف بالمدينة/المنطقة (إن حُدّد)
      if (!regionMatches(a.targetRegions, city)) return false;
      return true;
    });

    return json({
      ads: eligible.map((a) => ({ id: a.id, title: a.title, imageUrl: a.imageUrl, link: a.link, advertiser: a.advertiser })),
    });
  } catch {
    return json({ ads: [] });
  }
}
