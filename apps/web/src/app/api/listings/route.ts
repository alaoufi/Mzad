import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

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

  // إن اختير تصنيف أعلى (نوع/لون) نطابق كل السلالات المنحدرة منه
  let categoryFilter: Prisma.ListingWhereInput = {};
  if (categoryId) {
    const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
    const childrenMap = new Map<string, string[]>();
    for (const c of all) {
      if (c.parentId) {
        const arr = childrenMap.get(c.parentId) ?? [];
        arr.push(c.id);
        childrenMap.set(c.parentId, arr);
      }
    }
    const ids: string[] = [];
    const stack = [categoryId];
    while (stack.length) {
      const cur = stack.pop()!;
      ids.push(cur);
      const kids = childrenMap.get(cur);
      if (kids) stack.push(...kids);
    }
    categoryFilter = { categoryId: { in: ids } };
  }

  const where: Prisma.ListingWhereInput = {
    status: 'ACTIVE',
    ...categoryFilter,
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
        ? { create: dto.health.map((h: any) => ({ key: h.key, value: !!h.value, note: h.note ?? null })) }
        : undefined,
      media: dto.media?.length
        ? { create: dto.media.map((m: any, i: number) => ({ url: m.url, type: m.type ?? 'IMAGE', order: i })) }
        : undefined,
    },
  });

  if (dto.saleType === 'AUCTION' && dto.auction) {
    const now = new Date();
    const durationHours = Number(dto.auction.durationHours) || 24;
    await prisma.auction.create({
      data: {
        listingId: listing.id,
        startPrice: new Prisma.Decimal(dto.auction.startPrice),
        minIncrement: new Prisma.Decimal(dto.auction.minIncrement ?? 100),
        reservePrice: dto.auction.reservePrice != null ? new Prisma.Decimal(dto.auction.reservePrice) : null,
        deposit: dto.auction.deposit != null ? new Prisma.Decimal(dto.auction.deposit) : null,
        startAt: now,
        endAt: new Date(now.getTime() + durationHours * 3600_000),
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
