import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// بنود الحالة الصحية الظاهرة (لنموذج إضافة الإعلان)
export async function GET() {
  try {
    const items = await prisma.healthItem.findMany({
      where: { hidden: false },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return json({ items });
  } catch {
    return json({ items: [] });
  }
}
