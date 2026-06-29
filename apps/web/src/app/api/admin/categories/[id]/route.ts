import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تعديل اسم/أيقونة تصنيف
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { name, icon, hidden } = await req.json();
  await prisma.category.update({
    where: { id: params.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(icon !== undefined ? { icon: icon || null } : {}),
      ...(hidden !== undefined ? { hidden: !!hidden } : {}),
    },
  });
  return json({ ok: true });
}

// حذف تصنيف (مع حماية: لا حذف إن كان له فروع أو إعلانات)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const [children, listings] = await Promise.all([
    prisma.category.count({ where: { parentId: params.id } }),
    prisma.listing.count({ where: { categoryId: params.id } }),
  ]);
  if (children > 0) return json({ message: 'احذف الفروع التابعة أولاً' }, 400);
  if (listings > 0) return json({ message: 'يوجد إعلانات في هذا التصنيف' }, 400);

  await prisma.category.delete({ where: { id: params.id } });
  return json({ ok: true });
}
