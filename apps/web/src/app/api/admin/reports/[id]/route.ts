import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['OPEN', 'REVIEWING', 'RESOLVED', 'REJECTED'];

// تحديث حالة بلاغ (معالجة/رفض)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { status } = await req.json();
  if (!STATUSES.includes(status)) return json({ message: 'حالة غير صحيحة' }, 400);

  await prisma.report.update({ where: { id: params.id }, data: { status } });
  return json({ ok: true });
}
