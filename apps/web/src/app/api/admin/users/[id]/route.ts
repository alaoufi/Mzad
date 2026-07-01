import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { ACCOUNT_TYPES, roleForAccountType } from '@/lib/roles';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تعيين دور المستخدم (أحد الأدوار السبعة) — يضبط accountType والصلاحية المشتقّة
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const body = await req.json();
  const { accountType, identityStatus, active, name, phone, city, region, bio, experienceYears, bankName, bankAccount, iban, brokerSharePct, brokerCategories } = body;

  const data: any = {};
  if (active !== undefined) data.active = !!active;
  // مسؤوليات الدلال: نصيبه من العمولة ونطاق تصنيفاته
  if (brokerSharePct !== undefined) data.brokerSharePct = (brokerSharePct === null || brokerSharePct === '') ? null : Math.max(0, Math.min(100, Number(brokerSharePct)));
  if (Array.isArray(brokerCategories)) data.brokerCategories = brokerCategories.filter((x: any) => typeof x === 'string').slice(0, 50);
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
  // تعديل بيانات المستخدم (للإدارة)
  if (typeof name === 'string' && name.trim()) data.name = name.trim().slice(0, 80);
  if (typeof phone === 'string' && phone.trim()) data.phone = phone.trim().slice(0, 20);
  if (city !== undefined) data.city = (typeof city === 'string' && city.trim()) ? city.trim() : null;
  if (region !== undefined) data.region = (typeof region === 'string' && region.trim()) ? region.trim() : null;
  if (bio !== undefined) data.bio = (typeof bio === 'string' && bio.trim()) ? bio.trim().slice(0, 500) : null;
  if (experienceYears !== undefined) data.experienceYears = Number.isFinite(experienceYears) && experienceYears >= 0 ? Math.min(80, Math.floor(experienceYears)) : null;
  if (bankName !== undefined) data.bankName = (typeof bankName === 'string' && bankName.trim()) ? bankName.trim().slice(0, 60) : null;
  if (bankAccount !== undefined) data.bankAccount = (typeof bankAccount === 'string' && bankAccount.trim()) ? bankAccount.trim().slice(0, 40) : null;
  if (iban !== undefined) data.iban = (typeof iban === 'string' && iban.trim()) ? iban.trim().replace(/\s+/g, '').slice(0, 40) : null;

  if (Object.keys(data).length === 0) return json({ message: 'لا تغييرات' }, 400);

  try {
    await prisma.user.update({ where: { id: params.id }, data });
  } catch (e: any) {
    if (e?.code === 'P2002') return json({ message: 'رقم الجوال مستخدم لحساب آخر' }, 400);
    throw e;
  }

  if (identityStatus === 'VERIFIED') {
    await notify(params.id, 'VERIFIED', '🛡️ تم توثيق هويتك — تظهر شارة «موثّق» على إعلاناتك');
  }
  return json({ ok: true });
}

// حذف مستخدم (للإدارة) — يُمنع حذف النفس، ويُبلَّغ إن كان مرتبطاً بإعلانات
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  if (params.id === auth.sub) return json({ message: 'لا يمكنك حذف حسابك' }, 400);

  const cnt = await prisma.listing.count({ where: { sellerId: params.id } });
  if (cnt > 0) return json({ message: `لا يمكن الحذف: لدى المستخدم ${cnt} إعلاناً. عطّل الحساب بدلاً من حذفه.` }, 400);

  try {
    await prisma.user.delete({ where: { id: params.id } });
  } catch (e: any) {
    return json({ message: 'تعذّر الحذف — الحساب مرتبط ببيانات أخرى. عطّله بدلاً من حذفه.' }, 400);
  }
  return json({ ok: true });
}
