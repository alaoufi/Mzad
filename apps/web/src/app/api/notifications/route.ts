import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إشعاراتي + عدد غير المقروء
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  try {
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({ where: { userId: auth.sub }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.notification.count({ where: { userId: auth.sub, read: false } }),
    ]);
    return json({ items, unread });
  } catch {
    return json({ items: [], unread: 0 });
  }
}

// تعليم الكل كمقروء
export async function PATCH(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  await prisma.notification.updateMany({ where: { userId: auth.sub, read: false }, data: { read: true } });
  return json({ ok: true });
}
