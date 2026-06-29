import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// الشجرة الكاملة (تشمل المخفيّة) للإدارة
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  const species = await prisma.category.findMany({
    where: { level: 'SPECIES' },
    include: { children: { include: { children: true } } },
    orderBy: { name: 'asc' },
  });
  return json(species);
}

// إنشاء تصنيف (نوع/لون/سلالة)
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { name, level, parentId, icon, themeKey } = await req.json();
  if (!name?.trim()) return json({ message: 'الاسم مطلوب' }, 400);
  if (!['SPECIES', 'TYPE', 'BREED'].includes(level)) return json({ message: 'مستوى غير صحيح' }, 400);
  if (level !== 'SPECIES' && !parentId) return json({ message: 'يجب تحديد التصنيف الأب' }, 400);

  const created = await prisma.category.create({
    data: { name: name.trim(), level, parentId: parentId ?? null, icon: icon || null, themeKey: themeKey || null },
  });
  return json({ id: created.id }, 201);
}
