import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { ANIMAL_CATALOG, SUPPLIES_CATALOG, SUPPLIES_NAME } from '@/lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إعادة بناء شجرة التصنيف الافتراضية بالكامل (تحذف الإعلانات والتصنيفات الحالية)
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  // حذف الإعلانات (تتسلسل المزادات/المزايدات/الصحة/الميديا) ثم التصنيفات
  await prisma.listing.deleteMany();
  await prisma.category.deleteMany();

  let species = 0, types = 0, breeds = 0;

  let spOrder = 0;
  for (const [spName, { icon, groups }] of Object.entries(ANIMAL_CATALOG)) {
    const sp = await prisma.category.create({ data: { name: spName, level: 'SPECIES', icon, order: spOrder++ } });
    species++;
    let tOrder = 0;
    for (const [tName, { icon: tIcon, breeds: bs }] of Object.entries(groups)) {
      const t = await prisma.category.create({ data: { name: tName, level: 'TYPE', parentId: sp.id, icon: tIcon ?? null, order: tOrder++ } });
      types++;
      let bOrder = 0;
      for (const bName of bs) {
        await prisma.category.create({ data: { name: bName, level: 'BREED', parentId: t.id, order: bOrder++ } });
        breeds++;
      }
    }
  }

  // سوق المستلزمات
  const root = await prisma.category.create({ data: { name: SUPPLIES_NAME, level: 'SPECIES', icon: SUPPLIES_CATALOG.icon, order: spOrder } });
  let cOrder = 0;
  for (const [cat, { icon, items }] of Object.entries(SUPPLIES_CATALOG.groups)) {
    const c = await prisma.category.create({ data: { name: cat, level: 'TYPE', parentId: root.id, icon, order: cOrder++ } });
    let iOrder = 0;
    for (const it of items) {
      await prisma.category.create({ data: { name: it, level: 'BREED', parentId: c.id, order: iOrder++ } });
    }
  }

  return json({ ok: true, species, types, breeds });
}
