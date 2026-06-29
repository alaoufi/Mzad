import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // يستثني المخفيّة في كل المستويات
  const species = await prisma.category.findMany({
    where: { level: 'SPECIES', hidden: false },
    include: {
      children: {
        where: { hidden: false },
        include: { children: { where: { hidden: false } } },
      },
    },
    orderBy: { name: 'asc' },
  });
  return json(species);
}
