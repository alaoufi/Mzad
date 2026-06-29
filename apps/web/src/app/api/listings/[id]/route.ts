import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { isInBrokerScope } from '@/lib/category-scope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EDIT_WINDOW_MS = 2 * 60 * 60 * 1000; // ساعتان

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      category: { include: { parent: { include: { parent: true } } } },
      media: { orderBy: { order: 'asc' } },
      health: true,
      seller: {
        select: { id: true, name: true, phone: true, trustScore: true, identityStatus: true, city: true, region: true },
      },
      auction: { include: { bids: { orderBy: { amount: 'desc' }, take: 10 } } },
    },
  });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 404);
  // احترام «إخفاء الجوال»: لا نكشف رقم البائع إن طلب الإخفاء
  if (listing.hidePhone && listing.seller) (listing.seller as any).phone = null;
  return json(listing);
}

// تعديل الإعلان أو أرشفته
//  - الإدارة: تعديل كامل في أي وقت
//  - الدلال: تعديل إعلانات نطاقه (إن كان مفعّلاً)
//  - البائع: تعديل خلال ساعتين من النشر، والأرشفة/الاسترجاع في أي وقت
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'يجب تسجيل الدخول' }, 401);

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { sellerId: true, categoryId: true, createdAt: true },
  });
  if (!listing) return json({ message: 'الإعلان غير موجود' }, 404);

  const isOwner = listing.sellerId === auth.sub;
  const isAdmin = auth.role === 'ADMIN';
  let isBrokerInScope = false;
  if (auth.role === 'BROKER' && !isOwner) {
    const me = await prisma.user.findUnique({ where: { id: auth.sub }, select: { brokerCategories: true, active: true } });
    isBrokerInScope = (me?.active !== false) && (await isInBrokerScope(listing.categoryId, me?.brokerCategories ?? []));
  }
  const withinWindow = Date.now() - new Date(listing.createdAt).getTime() < EDIT_WINDOW_MS;

  const body = await req.json();
  const data: Prisma.ListingUpdateInput = {};

  // الأرشفة: للمالك أو الإدارة أو الدلال ضمن نطاقه — في أي وقت
  if (body.archived !== undefined) {
    if (!(isOwner || isAdmin || isBrokerInScope)) return json({ message: 'غير مصرّح بالأرشفة' }, 403);
    data.archived = !!body.archived;
  }

  // تعديل الحقول: الإدارة/الدلال في أي وقت، والمالك خلال ساعتين فقط
  const canEditFields = isAdmin || isBrokerInScope || (isOwner && withinWindow);
  const fieldKeys = ['title', 'description', 'count', 'sex', 'approxWeightKg', 'productionStatus', 'city', 'region', 'price'];
  const wantsFieldEdit = fieldKeys.some((k) => body[k] !== undefined);
  if (wantsFieldEdit) {
    if (!canEditFields) {
      return json({ message: isOwner ? 'انتهت مهلة تعديل الإعلان (ساعتان من النشر)' : 'غير مصرّح بتعديل هذا الإعلان' }, 403);
    }
    if (body.title !== undefined && String(body.title).trim()) data.title = String(body.title).trim();
    if (body.description !== undefined) data.description = String(body.description);
    if (body.count !== undefined) data.count = Number(body.count) || 1;
    if (body.sex !== undefined) data.sex = body.sex;
    if (body.approxWeightKg !== undefined) data.approxWeightKg = body.approxWeightKg ? Number(body.approxWeightKg) : null;
    if (body.productionStatus !== undefined) data.productionStatus = body.productionStatus || null;
    if (body.city !== undefined && String(body.city).trim()) data.city = String(body.city).trim();
    if (body.region !== undefined && String(body.region).trim()) data.region = String(body.region).trim();
    if (body.price !== undefined) data.price = body.price != null && body.price !== '' ? new Prisma.Decimal(body.price) : null;
  }

  if (Object.keys(data).length === 0) return json({ message: 'لا تغييرات' }, 400);
  await prisma.listing.update({ where: { id: params.id }, data });
  return json({ ok: true });
}
