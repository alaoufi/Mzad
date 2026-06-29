import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// قراءة كل الإعدادات (للإدارة)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  try {
    const rows = await prisma.appSetting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return json({ entryMode: map.entryMode === 'SPECIALIZED' ? 'SPECIALIZED' : 'GENERAL' });
  } catch {
    return json({ message: 'الجدول غير مهيّأ بعد (لم يُطبّق التعديل على قاعدة البيانات).' }, 503);
  }
}

// تعديل إعداد (وضع الدخول)
export async function PATCH(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { entryMode } = await req.json();
  if (entryMode !== undefined) {
    const value = entryMode === 'SPECIALIZED' ? 'SPECIALIZED' : 'GENERAL';
    await prisma.appSetting.upsert({
      where: { key: 'entryMode' },
      update: { value },
      create: { key: 'entryMode', value },
    });
  }
  return json({ ok: true });
}
