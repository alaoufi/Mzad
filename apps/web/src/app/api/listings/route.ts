import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { OPEN_END_ISO } from '@/lib/auction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

// بحث وفلترة الإعلانات مع ترتيب جغرافي
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q') ?? undefined;
  const categoryId = sp.get('categoryId') ?? undefined;
  const region = sp.get('region') ?? undefined;
  const saleType = sp.get('saleType') ?? undefined;
  const lat = sp.get('lat') ? Number(sp.get('lat')) : undefined;
  const lng = sp.get('lng') ? Number(sp.get('lng')) : undefined;
  const page = Math.max(1, Number(sp.get('page') ?? 1));

  const exclude = sp.get('exclude') ?? undefined;

  // تحميل كل التصنيفات مرة واحدة لحساب الأشجار والمخفيّ
  const allCats = await prisma.category.findMany({ select: { id: true, parentId: true, hidden: true } });
  const childrenMap = new Map<string, string[]>();
  for (const c of allCats) {
    if (c.parentId) {
      const arr = childrenMap.get(c.parentId) ?? [];
      arr.push(c.id);
      childrenMap.set(c.parentId, arr);
    }
  }
  const subtree = (rootId: string): string[] => {
    const ids: string[] = [];
    const stack = [rootId];
    while (stack.length) {
      const cur = stack.pop()!;
      ids.push(cur);
      const kids = childrenMap.get(cur);
      if (kids) stack.push(...kids);
    }
    return ids;
  };

  // كل التصنيفات المخفيّة وفروعها → تُستبعد إعلاناتها
  const hiddenIds = new Set<string>();
  for (const c of allCats) if (c.hidden) for (const id of subtree(c.id)) hiddenIds.add(id);

  // فلترة بعدّة تصنيفات (اهتمامات المستخدم) — اتحاد الأشجار الفرعية
  const categoryIdsParam = sp.get('categoryIds');
  const categoryIds = categoryIdsParam ? categoryIdsParam.split(',').filter(Boolean) : [];

  let categoryFilter: Prisma.ListingWhereInput = {};
  if (categoryId) {
    categoryFilter = { categoryId: { in: subtree(categoryId) } };
  } else if (categoryIds.length) {
    const union = new Set<string>();
    for (const id of categoryIds) for (const s of subtree(id)) union.add(s);
    categoryFilter = { categoryId: { in: [...union] } };
  }
  const excludeIds = new Set<string>(exclude ? subtree(exclude) : []);
  for (const id of hiddenIds) excludeIds.add(id);
  const excludeFilter: Prisma.ListingWhereInput = excludeIds.size ? { NOT: { categoryId: { in: [...excludeIds] } } } : {};

  const where: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
    archived: false,
    ...categoryFilter,
    ...excludeFilter,
    ...(region ? { region } : {}),
    ...(saleType ? { saleType: saleType as any } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        category: true,
        media: { orderBy: { order: 'asc' }, take: 1 },
        auction: { select: { id: true, status: true, endAt: true, highestBidId: true, startPrice: true } },
        seller: { select: { id: true, name: true, trustScore: true, identityStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
  ]);

  let sorted = items;
  if (lat != null && lng != null) {
    sorted = [...items].sort(
      (a, b) => haversine(lat, lng, a.lat, a.lng) - haversine(lat, lng, b.lat, b.lng),
    );
  }

  return json({ items: sorted, total, page, pageSize: PAGE_SIZE });
}

// إنشاء إعلان (يتطلب تسجيل دخول)
export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return json({ message: 'يجب تسجيل الدخول' }, 401);

  const dto = await req.json();
  if (!dto.title || !dto.categoryId || !dto.city || !dto.region || !dto.saleType) {
    return json({ message: 'بيانات ناقصة' }, 400);
  }

  // الإدارة تحدد ما يدخل: إعلانات الإدارة/الدلال تُنشر مباشرة، وغيرها تنتظر الموافقة
  const autoApprove = user.role === 'ADMIN' || user.role === 'BROKER';

  const listing = await prisma.listing.create({
    data: {
      sellerId: user.sub,
      categoryId: dto.categoryId,
      status: autoApprove ? 'ACTIVE' : 'DRAFT',
      title: dto.title,
      description: dto.description ?? '',
      count: Number(dto.count) || 1,
      sex: dto.sex ?? 'MIXED',
      approxWeightKg: dto.approxWeightKg ? Number(dto.approxWeightKg) : null,
      productionStatus: dto.productionStatus ?? null,
      saleType: dto.saleType,
      price: dto.price != null ? new Prisma.Decimal(dto.price) : null,
      city: dto.city,
      region: dto.region,
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
      hidePhone: !!dto.hidePhone,
      health: dto.health?.length
        ? { create: dto.health.map((h: any) => ({ key: h.key, label: h.label ?? null, value: !!h.value, note: h.note ?? null })) }
        : undefined,
      media: dto.media?.length
        ? { create: dto.media.map((m: any, i: number) => ({ url: m.url, type: m.type ?? 'IMAGE', order: i })) }
        : undefined,
    },
  });

  const now = new Date();
  const isBroker = user.role === 'BROKER' || user.role === 'ADMIN';
  if (dto.saleType === 'AUCTION' && dto.auction) {
    // مزاد مؤقّت — يدعم الجدولة بموعد بداية مستقبلي (للدلال)
    const durationHours = Number(dto.auction.durationHours) || 24;
    const startAt = dto.auction.startAt ? new Date(dto.auction.startAt) : now;
    const scheduled = startAt.getTime() > now.getTime() + 60_000;
    await prisma.auction.create({
      data: {
        listingId: listing.id,
        brokerId: isBroker ? user.sub : null,
        typeId: dto.auction.typeId || null,
        startPrice: new Prisma.Decimal(dto.auction.startPrice),
        minIncrement: new Prisma.Decimal(dto.auction.minIncrement ?? 100),
        reservePrice: dto.auction.reservePrice != null ? new Prisma.Decimal(dto.auction.reservePrice) : null,
        deposit: dto.auction.deposit != null ? new Prisma.Decimal(dto.auction.deposit) : null,
        startAt,
        endAt: new Date(startAt.getTime() + durationHours * 3600_000),
        status: scheduled ? 'SCHEDULED' : 'LIVE',
      },
    });
  } else if (dto.onsoom) {
    // عرض على السوم: مزايدة مفتوحة بلا وقت (saleType يبقى DIRECT)
    await prisma.auction.create({
      data: {
        listingId: listing.id,
        startPrice: new Prisma.Decimal(dto.auction?.startPrice ?? dto.price ?? 0),
        minIncrement: new Prisma.Decimal(dto.auction?.minIncrement ?? 100),
        startAt: now,
        endAt: new Date(OPEN_END_ISO),
        status: 'LIVE',
      },
    });
  }

  return json({ id: listing.id }, 201);
}

function haversine(lat1: number, lon1: number, lat2?: number | null, lon2?: number | null): number {
  if (lat2 == null || lon2 == null) return Number.POSITIVE_INFINITY;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
