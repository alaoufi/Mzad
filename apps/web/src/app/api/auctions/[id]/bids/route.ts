import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * تسجيل مزايدة بأمان ضد التزامن عبر معاملة Serializable على مستوى قاعدة البيانات.
 * في حال تصادم معاملتين، تفشل إحداهما (P2034/40001) ونعيد المحاولة تلقائياً.
 * هذا بديل القفل الموزّع (Redis) ويعمل في بيئة Serverless.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return json({ message: 'يجب تسجيل الدخول للمزايدة' }, 401);

  const { amount } = await req.json();
  const auctionId = params.id;
  const bidAmount = Number(amount);

  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const auction = await tx.auction.findUnique({
            where: { id: auctionId },
            include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
          });
          if (!auction) throw new HttpError(404, 'المزاد غير موجود');

          const now = new Date();
          if (auction.status !== 'LIVE' && auction.status !== 'SCHEDULED')
            throw new HttpError(400, 'المزاد غير مفتوح للمزايدة');
          if (now < auction.startAt) throw new HttpError(400, 'المزاد لم يبدأ بعد');
          if (now >= auction.endAt) throw new HttpError(400, 'انتهى وقت المزاد');

          const currentHighest = auction.bids[0]
            ? Number(auction.bids[0].amount)
            : Number(auction.startPrice);
          const minIncrement = Number(auction.minIncrement);
          const minAcceptable = auction.bids[0] ? currentHighest + minIncrement : currentHighest;

          if (bidAmount < minAcceptable)
            throw new HttpError(400, `العرض يجب أن يكون ${minAcceptable} ريال على الأقل`);

          const bid = await tx.bid.create({
            data: { auctionId, bidderId: user.sub, amount: new Prisma.Decimal(bidAmount) },
            include: { bidder: { select: { name: true } } },
          });

          // Anti-sniping: تمديد الوقت إن جاء العرض في النافذة الأخيرة
          let endAt = auction.endAt;
          let extended = false;
          if (endAt.getTime() - now.getTime() < auction.antiSnipingSec * 1000) {
            endAt = new Date(now.getTime() + auction.antiSnipingSec * 1000);
            extended = true;
          }

          await tx.auction.update({
            where: { id: auctionId },
            data: { highestBidId: bid.id, endAt, status: 'LIVE' },
          });

          const bidCount = await tx.bid.count({ where: { auctionId } });
          return {
            auctionId,
            listingId: auction.listingId,
            prevBidderId: auction.bids[0]?.bidderId ?? null,
            amount: bidAmount,
            bidderId: user.sub,
            bidderName: bid.bidder.name,
            highestBid: bidAmount,
            endAt: endAt.toISOString(),
            extended,
            bidCount,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      // إشعار صاحب أعلى عرض سابق بأنه تمّت المزايدة فوقه
      if (result.prevBidderId && result.prevBidderId !== user.sub) {
        await notify(result.prevBidderId, 'OUTBID',
          `🔔 تمت المزايدة فوق عرضك بمبلغ ${result.amount.toLocaleString('ar-SA')} ﷼`,
          `/listings/${result.listingId}`);
      }
      return json(result);
    } catch (e: any) {
      if (e instanceof HttpError) return json({ message: e.message }, e.status);
      // تصادم تسلسلية → أعد المحاولة
      if (e?.code === 'P2034' || e?.code === '40001') continue;
      return json({ message: 'تعذّرت المزايدة، حاول مجدداً' }, 500);
    }
  }
  return json({ message: 'ازدحام على المزاد، حاول مرة أخرى' }, 409);
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
