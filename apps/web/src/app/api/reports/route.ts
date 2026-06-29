import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGET_TYPES = ['listing', 'user', 'message', 'auction'];

// تقديم بلاغ (يتطلب تسجيل دخول)
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول للإبلاغ' }, 401);

  const { targetType, targetId, reason } = await req.json();
  if (!TARGET_TYPES.includes(targetType)) return json({ message: 'نوع البلاغ غير صحيح' }, 400);
  if (!targetId) return json({ message: 'الهدف مطلوب' }, 400);
  if (!reason?.trim()) return json({ message: 'سبب البلاغ مطلوب' }, 400);

  await prisma.report.create({
    data: { reporterId: auth.sub, targetType, targetId, reason: reason.trim() },
  });
  return json({ ok: true }, 201);
}
