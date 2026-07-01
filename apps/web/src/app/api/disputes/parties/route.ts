import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UBASIC = { id: true, name: true, phone: true, city: true, region: true, identityStatus: true } as const;

// يحدّد أطراف النزاع لإعلان معيّن:
//  - إن كنت البائع: تُعاد قائمة المشترين المتفاعلين (محادثات/مزايدات) لتختار خصمك.
//  - إن كنت المشتري: الطرف الآخر هو بائع الإعلان (معروف تلقائياً).
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  const listingId = req.nextUrl.searchParams.get('listingId');
  if (!listingId) return json({ message: 'الإعلان مطلوب' }, 400);

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, title: true, sellerId: true, seller: { select: UBASIC } },
  });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 404);

  const iAmSeller = listing.sellerId === auth.sub;

  if (!iAmSeller) {
    // مشترٍ → الطرف الآخر هو البائع
    return json({ listing: { id: listing.id, title: listing.title }, myRole: 'BUYER', against: listing.seller, candidates: [] });
  }

  // بائع → نجمع المشترين المتفاعلين: محادثات + مزايدات
  const [convs, bids] = await Promise.all([
    prisma.conversation.findMany({ where: { listingId, buyerId: { not: null } }, select: { buyerId: true } }),
    prisma.bid.findMany({ where: { auction: { listingId } }, select: { bidderId: true } }),
  ]);
  const ids = new Set<string>();
  convs.forEach((c) => c.buyerId && ids.add(c.buyerId));
  bids.forEach((b) => ids.add(b.bidderId));
  ids.delete(listing.sellerId);
  const candidates = ids.size
    ? await prisma.user.findMany({ where: { id: { in: [...ids] } }, select: UBASIC })
    : [];

  return json({ listing: { id: listing.id, title: listing.title }, myRole: 'SELLER', against: null, candidates });
}
