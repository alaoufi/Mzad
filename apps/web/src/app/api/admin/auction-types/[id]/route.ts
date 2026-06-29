import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  const { name, icon, description, commissionPct, requiresDeposit, active } = await req.json();
  await prisma.auctionType.update({
    where: { id: params.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(icon !== undefined ? { icon: icon?.trim() || null } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(commissionPct !== undefined ? { commissionPct: Number(commissionPct) || 0 } : {}),
      ...(requiresDeposit !== undefined ? { requiresDeposit: !!requiresDeposit } : {}),
      ...(active !== undefined ? { active: !!active } : {}),
    },
  });
  return json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  await prisma.auctionType.delete({ where: { id: params.id } });
  return json({ ok: true });
}
