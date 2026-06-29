import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تغيير دور مستخدم (إدارة)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { role } = await req.json();
  const allowed = ['USER', 'BROKER', 'ADMIN'];
  if (!allowed.includes(role)) return json({ message: 'دور غير صحيح' }, 400);

  await prisma.user.update({ where: { id: params.id }, data: { role } });
  return json({ ok: true });
}
