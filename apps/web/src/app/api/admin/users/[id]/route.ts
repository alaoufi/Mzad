import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { ACCOUNT_TYPES, roleForAccountType } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تعيين دور المستخدم (أحد الأدوار السبعة) — يضبط accountType والصلاحية المشتقّة
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { accountType } = await req.json();
  if (!ACCOUNT_TYPES.some((a) => a.key === accountType)) {
    return json({ message: 'دور غير صحيح' }, 400);
  }

  await prisma.user.update({
    where: { id: params.id },
    data: { accountType, role: roleForAccountType(accountType) },
  });
  return json({ ok: true });
}
