import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تغيير حالة إعلان (موافقة/رفض/إخفاء)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { status } = await req.json();
  const allowed = ['ACTIVE', 'DRAFT', 'CLOSED', 'SOLD'];
  if (!allowed.includes(status)) return json({ message: 'حالة غير صحيحة' }, 400);

  await prisma.listing.update({ where: { id: params.id }, data: { status } });
  return json({ ok: true });
}

// حذف إعلان (إدارة)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  await prisma.listing.delete({ where: { id: params.id } });
  return json({ ok: true });
}
