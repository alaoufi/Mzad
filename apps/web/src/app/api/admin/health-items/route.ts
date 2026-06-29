import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// قائمة كل البنود (شاملة المخفيّة) للإدارة
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  try {
    const items = await prisma.healthItem.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return json({ items });
  } catch {
    return json({ message: 'الجدول غير مهيّأ بعد (لم يُطبّق التعديل على قاعدة البيانات).' }, 503);
  }
}

// إضافة بند جديد
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { label } = await req.json();
  if (!label?.trim()) return json({ message: 'النص مطلوب' }, 400);
  const max = await prisma.healthItem.aggregate({ _max: { order: true } });
  const created = await prisma.healthItem.create({
    data: { label: label.trim(), order: (max._max.order ?? 0) + 1 },
  });
  return json({ id: created.id }, 201);
}
