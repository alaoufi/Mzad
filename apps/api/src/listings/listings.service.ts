import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, SearchListingsDto } from './dto';

const PAGE_SIZE = 20;

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sellerId: string, dto: CreateListingDto) {
    const listing = await this.prisma.listing.create({
      data: {
        sellerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        count: dto.count ?? 1,
        sex: dto.sex ?? 'MIXED',
        approxWeightKg: dto.approxWeightKg,
        productionStatus: dto.productionStatus,
        saleType: dto.saleType,
        price: dto.price != null ? new Prisma.Decimal(dto.price) : null,
        city: dto.city,
        region: dto.region,
        lat: dto.lat,
        lng: dto.lng,
        hidePhone: dto.hidePhone ?? false,
        health: dto.health?.length
          ? { create: dto.health.map((h) => ({ key: h.key, value: h.value, note: h.note })) }
          : undefined,
        media: dto.media?.length
          ? {
              create: dto.media.map((m, i) => ({
                url: m.url,
                type: (m.type as any) ?? 'IMAGE',
                order: i,
              })),
            }
          : undefined,
      },
    });

    // إنشاء المزاد إن كان النوع AUCTION
    if (dto.saleType === 'AUCTION' && dto.auction) {
      const now = new Date();
      const durationHours = dto.auction.durationHours ?? 24;
      await this.prisma.auction.create({
        data: {
          listingId: listing.id,
          startPrice: new Prisma.Decimal(dto.auction.startPrice),
          minIncrement: new Prisma.Decimal(dto.auction.minIncrement ?? 100),
          reservePrice:
            dto.auction.reservePrice != null
              ? new Prisma.Decimal(dto.auction.reservePrice)
              : null,
          deposit:
            dto.auction.deposit != null ? new Prisma.Decimal(dto.auction.deposit) : null,
          startAt: now,
          endAt: new Date(now.getTime() + durationHours * 3600_000),
          status: 'LIVE',
        },
      });
    }

    return this.findOne(listing.id);
  }

  async search(dto: SearchListingsDto) {
    const page = Math.max(1, dto.page ?? 1);
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      ...(dto.region ? { region: dto.region } : {}),
      ...(dto.saleType ? { saleType: dto.saleType } : {}),
      ...(dto.q
        ? {
            OR: [
              { title: { contains: dto.q, mode: 'insensitive' } },
              { description: { contains: dto.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
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
      this.prisma.listing.count({ where }),
    ]);

    // الترتيب الجغرافي: إن توفّر موقع المستخدم، رتّب الأقرب أولاً
    let sorted = items;
    if (dto.lat != null && dto.lng != null) {
      sorted = [...items].sort((a, b) => {
        const da = haversine(dto.lat!, dto.lng!, a.lat, a.lng);
        const db = haversine(dto.lat!, dto.lng!, b.lat, b.lng);
        return da - db;
      });
    }

    return { items: sorted, total, page, pageSize: PAGE_SIZE };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        category: { include: { parent: true } },
        media: { orderBy: { order: 'asc' } },
        health: true,
        seller: {
          select: {
            id: true,
            name: true,
            trustScore: true,
            identityStatus: true,
            city: true,
            region: true,
          },
        },
        auction: { include: { bids: { orderBy: { amount: 'desc' }, take: 10 } } },
      },
    });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    return listing;
  }

  myListings(sellerId: string) {
    return this.prisma.listing.findMany({
      where: { sellerId },
      include: { media: { take: 1 }, auction: { select: { status: true, endAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// المسافة بالكيلومترات بين نقطتين (Haversine)
function haversine(lat1: number, lon1: number, lat2?: number | null, lon2?: number | null): number {
  if (lat2 == null || lon2 == null) return Number.POSITIVE_INFINITY;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
