import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { canSupervise } from '@/lib/category-scope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// قائمة الدلالين ونطاقاتهم
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (!(await canSupervise(auth.sub, auth.role))) return json({ message: 'لكبير الدلالين أو الإدارة فقط' }, 403);
  try {
    const brokers = await prisma.user.findMany({
      where: { role: 'BROKER' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, accountType: true, brokerCategories: true },
    });
    return json({ brokers });
  } catch {
    return json({ message: 'الجدول غير مهيّأ بعد (لم يُطبّق التعديل على قاعدة البيانات).' }, 503);
  }
}
