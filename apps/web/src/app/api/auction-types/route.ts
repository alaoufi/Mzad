import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// أنواع المزادات الفعّالة (عامة — لاختيارها عند إنشاء مزاد)
export async function GET() {
  try {
    const types = await prisma.auctionType.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, icon: true, commissionPct: true, requiresDeposit: true },
    });
    return json({ types });
  } catch {
    return json({ types: [] });
  }
}
