import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// محفظة المستخدم: الرصيد + سجل الحركات
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  try {
    const [txns, agg] = await Promise.all([
      prisma.walletTxn.findMany({ where: { userId: auth.sub }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.walletTxn.aggregate({ where: { userId: auth.sub }, _sum: { amount: true } }),
    ]);
    return json({ balance: Number(agg._sum.amount ?? 0), txns });
  } catch {
    return json({ balance: 0, txns: [] });
  }
}
