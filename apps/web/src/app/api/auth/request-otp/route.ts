import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, normalizePhone } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone || !/^(05|9665|\+9665)\d{8}$/.test(String(phone).replace(/\s|-/g, ''))) {
    return json({ message: 'رقم جوال غير صحيح (مثال: 05XXXXXXXX)' }, 400);
  }
  const normalized = normalizePhone(phone);
  const code = String(Math.floor(1000 + Math.random() * 9000));
  await prisma.otpCode.create({
    data: { phone: normalized, code, expiresAt: new Date(Date.now() + 5 * 60_000) },
  });
  // وضع التجربة: نُعيد الرمز مباشرة (لا مزوّد SMS في النسخة التجريبية)
  return json({ sent: true, devCode: code });
}
