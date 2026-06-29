import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Node {
  id: string; name: string; icon: string | null; themeKey: string | null;
  level: string; order: number; parentId: string | null; children: Node[];
}

// شجرة التصنيفات بأي عمق (تستثني المخفيّة وفروعها)
export async function GET() {
  const all = await prisma.category.findMany({
    where: { hidden: false },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, icon: true, themeKey: true, level: true, order: true, parentId: true },
  });

  const map = new Map<string, Node>();
  for (const c of all) map.set(c.id, { ...c, children: [] });

  const roots: Node[] = [];
  for (const c of all) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) map.get(c.parentId)!.children.push(node);
    else if (!c.parentId) roots.push(node);
    // ملاحظة: العقدة التي أبوها مخفيّ تُستبعد ضمنياً (الأب غير موجود في الخريطة)
  }
  return json(roots);
}
