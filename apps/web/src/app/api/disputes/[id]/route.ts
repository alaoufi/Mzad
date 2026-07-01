import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// إفادة الطرف الآخر (المشتكى عليه) على النزاع + أدلّته
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);

  const d = await prisma.dispute.findUnique({ where: { id: params.id }, select: { openedById: true, againstId: true } });
  if (!d) return json({ message: 'النزاع غير موجود' }, 404);
  if (d.againstId !== auth.sub) return json({ message: 'الرد متاح للطرف الآخر في النزاع فقط' }, 403);

  const { response, responseEvidence } = await req.json();
  if (!response?.trim()) return json({ message: 'اكتب إفادتك' }, 400);
  const ev = Array.isArray(responseEvidence) ? responseEvidence.filter((x: any) => typeof x === 'string').slice(0, 8) : [];

  await prisma.dispute.update({
    where: { id: params.id },
    data: { response: response.trim(), responseEvidence: ev, respondedAt: new Date() },
  });
  await notify(d.openedById, 'DISPUTE', '⚖️ قدّم الطرف الآخر إفادته على نزاعك', '/disputes').catch(() => {});
  return json({ ok: true });
}
