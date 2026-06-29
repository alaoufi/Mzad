import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تعديل بند (النص / الترتيب / الإخفاء)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { label, order, hidden } = await req.json();
  await prisma.healthItem.update({
    where: { id: params.id },
    data: {
      ...(label?.trim() ? { label: label.trim() } : {}),
      ...(order !== undefined ? { order: Number(order) || 0 } : {}),
      ...(hidden !== undefined ? { hidden: !!hidden } : {}),
    },
  });
  return json({ ok: true });
}

// حذف بند
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  await prisma.healthItem.delete({ where: { id: params.id } });
  return json({ ok: true });
}
