import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// كل التصنيفات (مسطّحة، تشمل المخفيّة) — يبني العميل الشجرة بأي عمق
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  const all = await prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, level: true, icon: true, themeKey: true,
      motifKey: true, shapeKey: true, layoutKey: true, cardStyle: true,
      hidden: true, order: true, parentId: true,
    },
  });
  return json(all);
}

// عمق الأب يحدّد المستوى (للحفاظ على enum مع دعم أي عمق)
async function depthLevel(parentId?: string | null): Promise<'SPECIES' | 'TYPE' | 'BREED'> {
  if (!parentId) return 'SPECIES';
  let depth = 1;
  let cur = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
  while (cur?.parentId) { depth++; cur = await prisma.category.findUnique({ where: { id: cur.parentId }, select: { parentId: true } }); }
  return depth === 1 ? 'TYPE' : 'BREED';
}

// إنشاء تصنيف على أي مستوى (الرأس أو أي فرع)
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { name, parentId, icon, themeKey, motifKey, shapeKey, layoutKey, cardStyle } = await req.json();
  if (!name?.trim()) return json({ message: 'الاسم مطلوب' }, 400);

  const level = await depthLevel(parentId);
  const max = await prisma.category.aggregate({ where: { parentId: parentId ?? null }, _max: { order: true } });

  const created = await prisma.category.create({
    data: {
      name: name.trim(),
      level,
      parentId: parentId ?? null,
      icon: icon || null,
      themeKey: themeKey || null,
      motifKey: motifKey || null,
      shapeKey: shapeKey || null,
      layoutKey: layoutKey || null,
      cardStyle: cardStyle || null,
      order: (max._max.order ?? 0) + 1,
    },
  });
  return json({ id: created.id }, 201);
}
