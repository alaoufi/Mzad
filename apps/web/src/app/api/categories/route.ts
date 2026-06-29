import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const species = await prisma.category.findMany({
    where: { level: 'SPECIES' },
    include: { children: { include: { children: true } } },
    orderBy: { name: 'asc' },
  });
  return json(species);
}
