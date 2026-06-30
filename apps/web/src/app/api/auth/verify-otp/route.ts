import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, normalizePhone, signToken } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { phone, code, name, profile } = await req.json();
  const normalized = normalizePhone(phone ?? '');

  // بيانات اختيارية يضيفها الزائر عند التسجيل
  const optional: any = {};
  if (profile && typeof profile === 'object') {
    if (typeof profile.bio === 'string' && profile.bio.trim()) optional.bio = profile.bio.trim().slice(0, 500);
    if (Number.isFinite(profile.experienceYears) && profile.experienceYears >= 0) optional.experienceYears = Math.min(80, Math.floor(profile.experienceYears));
    if (typeof profile.bankName === 'string' && profile.bankName.trim()) optional.bankName = profile.bankName.trim().slice(0, 60);
    if (typeof profile.bankAccount === 'string' && profile.bankAccount.trim()) optional.bankAccount = profile.bankAccount.trim().slice(0, 40);
    if (typeof profile.iban === 'string' && profile.iban.trim()) optional.iban = profile.iban.trim().replace(/\s+/g, '').slice(0, 40);
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone: normalized, code, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return json({ message: 'رمز التحقق غير صحيح أو منتهي' }, 400);

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  // أرقام الإدارة (تُمنح صلاحية ADMIN تلقائياً)
  const ADMIN_PHONES = (process.env.ADMIN_PHONES ?? '966500000000').split(',');
  const isAdmin = ADMIN_PHONES.includes(normalized);

  let user = await prisma.user.findUnique({ where: { phone: normalized } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        phone: normalized,
        name: (name ?? '').trim() || (isAdmin ? 'مشرف المنصة' : 'مستخدم جديد'),
        isPhoneVerified: true,
        role: isAdmin ? 'ADMIN' : 'USER',
        accountType: isAdmin ? 'SUPER_ADMIN' : 'SHOPPER',
        ...optional,
      },
    });
  } else {
    // عند العودة: نملأ فقط الحقول الفارغة بما أدخله الآن (لا نطمس بياناته السابقة)
    const fill: any = {};
    for (const k of ['bio', 'experienceYears', 'bankName', 'bankAccount', 'iban'] as const) {
      if (optional[k] !== undefined && (user as any)[k] == null) fill[k] = optional[k];
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        isPhoneVerified: true,
        ...(isAdmin && user.role !== 'ADMIN' ? { role: 'ADMIN', accountType: 'SUPER_ADMIN' } : {}),
        ...fill,
      },
    });
  }

  const token = signToken({ sub: user.id, role: user.role, name: user.name });
  return json({ token, user });
}
