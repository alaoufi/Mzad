import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// شحن المحفظة (تجريبي — بانتظار ربط بوابة دفع حقيقية)
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const { amount } = await req.json();
  const value = Number(amount);
  if (!value || value <= 0) return json({ message: 'المبلغ غير صحيح' }, 400);
  if (value > 1_000_000) return json({ message: 'المبلغ كبير جداً' }, 400);

  await prisma.walletTxn.create({
    data: {
      userId: auth.sub,
      type: 'TOPUP',
      amount: new Prisma.Decimal(value),
      note: 'شحن تجريبي للمحفظة',
    },
  });
  return json({ ok: true }, 201);
}
