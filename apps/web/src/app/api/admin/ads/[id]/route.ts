import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  const b = await req.json();
  await prisma.ad.update({
    where: { id: params.id },
    data: {
      ...(b.title?.trim() ? { title: b.title.trim() } : {}),
      ...(b.imageUrl !== undefined ? { imageUrl: b.imageUrl?.trim() || null } : {}),
      ...(b.link !== undefined ? { link: b.link?.trim() || null } : {}),
      ...(b.placement ? { placement: b.placement } : {}),
      ...(b.status ? { status: b.status } : {}),
      ...(b.priority !== undefined ? { priority: Number(b.priority) || 0 } : {}),
    },
  });
  return json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth || auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  await prisma.ad.delete({ where: { id: params.id } });
  return json({ ok: true });
}
