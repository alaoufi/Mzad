import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { notify } from '@/lib/notify';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// نزاعاتي — ما فتحتُه وما رُفع ضدّي (لأقدّم ردّي)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  try {
    const disputes = await prisma.dispute.findMany({
      where: { OR: [{ openedById: auth.sub }, { againstId: auth.sub }] },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true } },
        openedBy: { select: { name: true } },
      },
    });
    // نُعلّم كل نزاع بدور المستخدم فيه (مشتكٍ/مشتكى عليه)
    const withRole = disputes.map((d) => ({ ...d, myRole: d.openedById === auth.sub ? 'OPENER' : 'AGAINST' }));
    return json({ disputes: withRole });
  } catch {
    return json({ disputes: [] });
  }
}

// فتح نزاع جديد — مع جمع الأدلة والمعلومات لإثبات الشكوى
export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول' }, 401);

  const { listingId, reason, detail, category, amount, incidentAt, desired, contact, evidence, againstId: againstInput, paymentMethod, transferRef, witnesses, declared } = await req.json();
  if (!declared) return json({ message: 'يجب الإقرار بصحة المعلومات وتحمّل المسؤولية' }, 400);
  if (!listingId) return json({ message: 'اختر الإعلان محل النزاع' }, 400);
  if (!reason?.trim()) return json({ message: 'سبب النزاع مطلوب' }, 400);

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { sellerId: true } });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 400);

  // تحديد الطرف الآخر: المشتري ضدّه بائع الإعلان تلقائياً؛ والبائع يحدّد المشتري صراحةً
  const iAmSeller = listing.sellerId === auth.sub;
  let againstId: string | null = iAmSeller ? (againstInput || null) : listing.sellerId;
  if (iAmSeller && !againstId) return json({ message: 'حدّد الطرف الآخر (المشتري) محل النزاع' }, 400);
  if (againstId === auth.sub) return json({ message: 'لا يمكن فتح نزاع ضدّ نفسك' }, 400);
  if (againstId) {
    const exists = await prisma.user.findUnique({ where: { id: againstId }, select: { id: true } });
    if (!exists) return json({ message: 'الطرف الآخر غير موجود' }, 400);
  }

  const ev = Array.isArray(evidence) ? evidence.filter((x: any) => typeof x === 'string').slice(0, 8) : [];

  await prisma.dispute.create({
    data: {
      openedById: auth.sub,
      listingId: listingId || null,
      againstId,
      reason: reason.trim(),
      detail: detail?.trim() || null,
      category: category || null,
      amount: amount != null && amount !== '' ? amount : null,
      incidentAt: incidentAt ? new Date(incidentAt) : null,
      desired: desired || null,
      contact: contact?.trim() || null,
      evidence: ev,
      paymentMethod: paymentMethod || null,
      transferRef: transferRef?.trim() || null,
      witnesses: witnesses?.trim() || null,
      declared: true,
    },
  });
  // إشعار الطرف الآخر ليقدّم إفادته
  if (againstId) {
    await notify(againstId, 'DISPUTE', '⚖️ فُتح نزاع بخصوص إحدى صفقاتك — قدّم إفادتك من «نزاعاتي»', '/disputes').catch(() => {});
  }
  return json({ ok: true }, 201);
}
