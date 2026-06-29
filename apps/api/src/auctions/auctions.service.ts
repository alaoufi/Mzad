import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface BidResult {
  auctionId: string;
  amount: number;
  bidderId: string;
  bidderName: string;
  highestBid: number;
  endAt: string;
  extended: boolean;
  bidCount: number;
}

@Injectable()
export class AuctionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getState(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        listing: { select: { id: true, title: true, city: true, region: true } },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: { bidder: { select: { id: true, name: true } } },
        },
      },
    });
    if (!auction) throw new NotFoundException('المزاد غير موجود');

    const highest = auction.bids[0];
    return {
      ...auction,
      highestBid: highest ? Number(highest.amount) : Number(auction.startPrice),
      bidCount: await this.prisma.bid.count({ where: { auctionId } }),
    };
  }

  /**
   * تسجيل مزايدة بأمان تام ضد التزامن:
   * 1) قفل موزّع على المزاد (Redis أو داخلي).
   * 2) معاملة Serializable: التحقق من الشروط وكتابة المزايدة ذرّياً.
   * 3) Anti-sniping: تمديد الوقت إن جاء العرض في النافذة الأخيرة.
   */
  async placeBid(auctionId: string, bidderId: string, amount: number): Promise<BidResult> {
    const lockKey = `lock:auction:${auctionId}`;

    return this.redis.withLock(lockKey, async () => {
      return this.prisma.$transaction(
        async (tx) => {
          const auction = await tx.auction.findUnique({
            where: { id: auctionId },
            include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
          });
          if (!auction) throw new NotFoundException('المزاد غير موجود');

          const now = new Date();
          if (auction.status !== 'LIVE' && auction.status !== 'SCHEDULED') {
            throw new BadRequestException('المزاد غير مفتوح للمزايدة');
          }
          if (now < auction.startAt) {
            throw new BadRequestException('المزاد لم يبدأ بعد');
          }
          if (now >= auction.endAt) {
            throw new BadRequestException('انتهى وقت المزاد');
          }

          const currentHighest = auction.bids[0]
            ? Number(auction.bids[0].amount)
            : Number(auction.startPrice);
          const minIncrement = Number(auction.minIncrement);
          const minAcceptable = auction.bids[0]
            ? currentHighest + minIncrement
            : currentHighest; // أول عرض يساوي سعر البداية على الأقل

          if (amount < minAcceptable) {
            throw new BadRequestException(
              `العرض يجب أن يكون ${minAcceptable} ريال على الأقل`,
            );
          }

          // كتابة المزايدة
          const bid = await tx.bid.create({
            data: {
              auctionId,
              bidderId,
              amount: new Prisma.Decimal(amount),
            },
            include: { bidder: { select: { name: true } } },
          });

          // Anti-sniping: إن بقي أقل من النافذة، مدّد النهاية
          let endAt = auction.endAt;
          let extended = false;
          const remainingMs = endAt.getTime() - now.getTime();
          if (remainingMs < auction.antiSnipingSec * 1000) {
            endAt = new Date(now.getTime() + auction.antiSnipingSec * 1000);
            extended = true;
          }

          await tx.auction.update({
            where: { id: auctionId },
            data: {
              highestBidId: bid.id,
              endAt,
              status: 'LIVE',
            },
          });

          const bidCount = await tx.bid.count({ where: { auctionId } });

          return {
            auctionId,
            amount,
            bidderId,
            bidderName: bid.bidder.name,
            highestBid: amount,
            endAt: endAt.toISOString(),
            extended,
            bidCount,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    });
  }

  /** إغلاق المزادات المنتهية (تُستدعى دورياً). */
  async closeExpired(): Promise<number> {
    const res = await this.prisma.auction.updateMany({
      where: { status: 'LIVE', endAt: { lte: new Date() } },
      data: { status: 'ENDED' },
    });
    return res.count;
  }
}
