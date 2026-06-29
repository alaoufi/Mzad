import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        city: true,
        region: true,
        isPhoneVerified: true,
        identityStatus: true,
        trustScore: true,
        createdAt: true,
        _count: { select: { listings: true, reviewsReceived: true } },
      },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const reviews = await this.prisma.review.aggregate({
      where: { targetId: id },
      _avg: { rating: true, descMatch: true },
      _count: true,
    });

    return {
      ...user,
      ratings: {
        avgRating: reviews._avg.rating ?? 0,
        avgDescMatch: reviews._avg.descMatch ?? 0,
        count: reviews._count,
      },
    };
  }
}
