import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, normalizePhone, signToken } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { phone, code, name } = await req.json();
  const normalized = normalizePhone(phone ?? '');

  const otp = await prisma.otpCode.findFirst({
    where: { phone: normalized, code, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return json({ message: 'رمز التحقق غير صحيح أو منتهي' }, 400);

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  let user = await prisma.user.findUnique({ where: { phone: normalized } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone: normalized, name: (name ?? '').trim() || 'مستخدم جديد', isPhoneVerified: true },
    });
  } else if (!user.isPhoneVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true },
    });
  }

  const token = signToken({ sub: user.id, role: user.role, name: user.name });
  return json({ token, user });
}
