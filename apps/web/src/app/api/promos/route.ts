import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';
import { OPEN_END_ISO } from '@/lib/auction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// عروض ترويجية لملء أماكن الإعلانات الفارغة: مزادات نشطة + عروض مميّزة، مفلترة باهتمام الزائر
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const region = sp.get('region') ?? undefined;
  const catsParam = sp.get('cats');
  const catIds = catsParam ? catsParam.split(',').map((s) => s.trim()).filter(Boolean) : [];

  // شجرة التصنيفات لحساب الأشجار الفرعية (نفس منطق قائمة الإعلانات)
  const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
  const childrenMap = new Map<string, string[]>();
  for (const c of allCats) if (c.parentId) {
    const arr = childrenMap.get(c.parentId) ?? []; arr.push(c.id); childrenMap.set(c.parentId, arr);
  }
  const subtree = (rootId: string): string[] => {
    const ids: string[] = []; const stack = [rootId];
    while (stack.length) { const cur = stack.pop()!; ids.push(cur); const k = childrenMap.get(cur); if (k) stack.push(...k); }
    return ids;
  };
  let catFilter: Prisma.ListingWhereInput = {};
  if (catIds.length) {
    const union = new Set<string>();
    for (const id of catIds) for (const s of subtree(id)) union.add(s);
    catFilter = { categoryId: { in: [...union] } };
  }

  const base: Prisma.ListingWhereInput = { status: 'ACTIVE', archived: false, ...catFilter };
  const include = {
    category: { select: { name: true, icon: true } },
    media: { where: { type: 'IMAGE' as const }, orderBy: { order: 'asc' as const }, take: 1 },
    auction: { select: { endAt: true, startPrice: true, highestBidId: true } },
    seller: { select: { name: true, identityStatus: true } },
  };

  const now = new Date();
  const [auctions, offers] = await Promise.all([
    // مزادات نشطة مؤقّتة، الأقرب انتهاءً أولاً
    prisma.listing.findMany({
      where: { ...base, saleType: 'AUCTION', auction: { is: { endAt: { gt: now, not: new Date(OPEN_END_ISO) } } } },
      include, orderBy: { auction: { endAt: 'asc' } }, take: 8,
    }),
    // عروض مميّزة: من بائعين موثّقين أولاً ثم الأحدث
    prisma.listing.findMany({
      where: { ...base, saleType: 'DIRECT' },
      include, orderBy: [{ seller: { identityStatus: 'asc' } }, { createdAt: 'desc' }], take: 8,
    }),
  ]);

  const toPromo = (l: any, kind: 'AUCTION' | 'OFFER') => ({
    id: l.id,
    kind,
    title: l.title,
    city: l.city ?? '',
    image: l.media?.[0]?.url ?? null,
    icon: l.category?.icon ?? null,
    categoryName: l.category?.name ?? null,
    verified: l.seller?.identityStatus === 'VERIFIED',
    endAt: kind === 'AUCTION' ? l.auction?.endAt ?? null : null,
    price: kind === 'AUCTION'
      ? (l.auction?.startPrice != null ? Number(l.auction.startPrice) : null)
      : (l.price != null ? Number(l.price) : null),
  });

  // مزج: مزاد ثم عرض بالتناوب، إزالة التكرار، حد أقصى ١٢
  const a = auctions.map((l) => toPromo(l, 'AUCTION'));
  const o = offers.map((l) => toPromo(l, 'OFFER'));
  const merged: any[] = [];
  const seen = new Set<string>();
  for (let k = 0; k < Math.max(a.length, o.length); k++) {
    for (const item of [a[k], o[k]]) {
      if (item && !seen.has(item.id)) { seen.add(item.id); merged.push(item); }
    }
  }
  return json({ promos: merged.slice(0, 12), region: region ?? null });
}
