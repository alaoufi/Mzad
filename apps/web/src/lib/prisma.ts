import { PrismaClient } from '@prisma/client';

// عميل Prisma وحيد (Singleton) لتفادي تعدّد الاتصالات في بيئة Serverless
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['error', 'warn'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
