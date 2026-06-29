import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تغيير حالة إعلان (موافقة/رفض/إخفاء/بيع)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const { status } = await req.json();
  const allowed = ['ACTIVE', 'DRAFT', 'CLOSED', 'SOLD'];
  if (!allowed.includes(status)) return json({ message: 'حالة غير صحيحة' }, 400);

  const before = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { status: true, sellerId: true },
  });

  await prisma.listing.update({ where: { id: params.id }, data: { status } });

  // عند تحويل الإعلان إلى «مُباع» لأول مرة: قيد عمولة المنصة على البائع حسب نوع المزاد
  if (status === 'SOLD' && before && before.status !== 'SOLD') {
    try {
      await recordCommission(params.id, before.sellerId);
    } catch {
      // العمولة اختيارية — لا تُفشل تغيير الحالة
    }
  }
  return json({ ok: true });
}

// احتساب عمولة البيع وقيدها كحركة سالبة في محفظة البائع
async function recordCommission(listingId: string, sellerId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      price: true,
      auction: {
        select: {
          highestBidId: true,
          type: { select: { commissionPct: true } },
          bids: { orderBy: { amount: 'desc' }, take: 1, select: { amount: true } },
        },
      },
    },
  });
  if (!listing) return;

  const pct = listing.auction?.type?.commissionPct ?? 0;
  if (!pct) return; // لا عمولة محددة لنوع المزاد

  // قيمة الصفقة: أعلى مزايدة إن وُجدت، وإلا السعر الثابت
  const finalAmount = listing.auction?.bids?.[0]?.amount ?? listing.price;
  if (!finalAmount) return;

  const commission = new Prisma.Decimal(finalAmount).mul(pct).div(100);
  if (commission.lte(0)) return;

  // تفادي التكرار إن سبق قيد عمولة لهذا الإعلان
  const existing = await prisma.walletTxn.findFirst({
    where: { userId: sellerId, type: 'COMMISSION', refId: listingId },
  });
  if (existing) return;

  await prisma.walletTxn.create({
    data: {
      userId: sellerId,
      type: 'COMMISSION',
      amount: commission.negated(),
      refId: listingId,
      note: `عمولة المنصة (${pct}%) على بيع الإعلان`,
    },
  });
}

// حذف إعلان (إدارة)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  await prisma.listing.delete({ where: { id: params.id } });
  return json({ ok: true });
}
