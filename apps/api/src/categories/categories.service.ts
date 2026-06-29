import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** الشجرة الكاملة للتصنيفات (نوع ← سلالة). */
  async tree() {
    const species = await this.prisma.category.findMany({
      where: { level: 'SPECIES' },
      include: { children: { include: { children: true } } },
      orderBy: { name: 'asc' },
    });
    return species;
  }

  /** أبناء تصنيف معيّن (للقوائم المتسلسلة في الواجهة). */
  children(parentId: string) {
    return this.prisma.category.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
    });
  }
}
