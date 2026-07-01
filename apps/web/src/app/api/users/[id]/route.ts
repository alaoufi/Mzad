import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';
import { lightenMedia } from '@/lib/media-link';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// الملف العام لأي مستخدم — يطّلع عليه أي زائر: التقييم والنشاط في السوق فقط.
// لا يكشف بيانات التواصل الخاصة (الجوال/البنك) ولا المنطقة/المدينة.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, accountType: true, identityStatus: true,
      trustScore: true, bio: true, experienceYears: true, createdAt: true,
    },
  });
  if (!user) return json({ message: 'المستخدم غير موجود' }, 404);

  const [sales, activeListings, totalListings, reviews, recent] = await Promise.all([
    prisma.listing.count({ where: { sellerId: params.id, status: 'SOLD' } }),
    prisma.listing.count({ where: { sellerId: params.id, status: 'ACTIVE', archived: false } }),
    prisma.listing.count({ where: { sellerId: params.id } }),
    prisma.review.aggregate({ where: { targetId: params.id }, _avg: { rating: true }, _count: true }),
    prisma.listing.findMany({
      where: { sellerId: params.id, status: 'ACTIVE', archived: false },
      orderBy: { createdAt: 'desc' }, take: 8,
      include: {
        category: true,
        media: { where: { type: 'IMAGE' }, orderBy: { order: 'asc' }, take: 1 },
        auction: { select: { id: true, status: true, endAt: true, startPrice: true } },
        seller: { select: { id: true, name: true, trustScore: true, identityStatus: true } },
      },
    }),
  ]);

  return json({
    user,
    stats: {
      sales, activeListings, totalListings,
      avgRating: reviews._avg.rating ?? 0, reviewsCount: reviews._count,
    },
    listings: recent.map(lightenMedia),
  });
}
