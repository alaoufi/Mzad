import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  try {
    const types = await prisma.auctionType.findMany({ orderBy: { createdAt: 'asc' } });
    return json({ types });
  } catch {
    return json({ message: 'الجدول غير مهيّأ بعد (لم يُطبّق التعديل على قاعدة البيانات).' }, 503);
  }
}

export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { name, icon, description, commissionPct, requiresDeposit } = await req.json();
  if (!name?.trim()) return json({ message: 'الاسم مطلوب' }, 400);
  const created = await prisma.auctionType.create({
    data: {
      name: name.trim(),
      icon: icon?.trim() || null,
      description: description?.trim() || null,
      commissionPct: Number(commissionPct) || 0,
      requiresDeposit: !!requiresDeposit,
    },
  });
  return json({ id: created.id }, 201);
}
