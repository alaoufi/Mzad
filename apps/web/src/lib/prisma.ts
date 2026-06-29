import { PrismaClient } from '@prisma/client';

// عميل Prisma وحيد (Singleton) لتفادي تعدّد الاتصالات في بيئة Serverless
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error'] });

// نحتفظ بالعميل على المستوى العام حتى في الإنتاج لإعادة استخدام الاتصال داخل النسخة الدافئة
globalForPrisma.prisma = prisma;
