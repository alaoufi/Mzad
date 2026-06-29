import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// كل النزاعات (للإدارة)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  try {
    const disputes = await prisma.dispute.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        listing: { select: { id: true, title: true } },
        openedBy: { select: { name: true, phone: true } },
      },
    });
    return json({ disputes });
  } catch {
    return json({ message: 'الجدول غير مهيّأ بعد (لم يُطبّق التعديل على قاعدة البيانات).' }, 503);
  }
}
