import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { canSupervise } from '@/lib/category-scope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تعيين نطاق الدلال (التصنيفات المُسندة)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (!(await canSupervise(auth.sub, auth.role))) return json({ message: 'لكبير الدلالين أو الإدارة فقط' }, 403);

  const { brokerCategories, active, brokerSharePct } = await req.json();

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
  if (!target || target.role !== 'BROKER') return json({ message: 'المستخدم ليس دلالاً' }, 400);

  const data: any = {};
  if (Array.isArray(brokerCategories)) data.brokerCategories = brokerCategories.filter((x: any) => typeof x === 'string').slice(0, 100);
  if (active !== undefined) data.active = !!active;
  if (brokerSharePct !== undefined) data.brokerSharePct = brokerSharePct === null || brokerSharePct === '' ? null : Math.max(0, Math.min(100, Number(brokerSharePct) || 0));
  if (Object.keys(data).length === 0) return json({ message: 'لا تغييرات' }, 400);

  await prisma.user.update({ where: { id: params.id }, data });
  return json({ ok: true });
}
