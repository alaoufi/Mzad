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

  const { accountType, identityStatus } = await req.json();

  const data: any = {};
  if (accountType !== undefined) {
    if (!ACCOUNT_TYPES.some((a) => a.key === accountType)) {
      return json({ message: 'دور غير صحيح' }, 400);
    }
    data.accountType = accountType;
    data.role = roleForAccountType(accountType);
  }
  if (identityStatus !== undefined) {
    if (!['NONE', 'PENDING', 'VERIFIED'].includes(identityStatus)) {
      return json({ message: 'حالة توثيق غير صحيحة' }, 400);
    }
    data.identityStatus = identityStatus;
  }
  if (Object.keys(data).length === 0) return json({ message: 'لا تغييرات' }, 400);

  await prisma.user.update({ where: { id: params.id }, data });
  return json({ ok: true });
}
