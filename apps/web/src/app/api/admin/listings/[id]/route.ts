import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { getCommissionConfig } from '@/lib/commission';
import { notify } from '@/lib/notify';

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

  // إشعار البائع عند الموافقة على إعلانه
  if (status === 'ACTIVE' && before && before.status === 'DRAFT') {
    await notify(before.sellerId, 'LISTING_APPROVED', '✅ تمت الموافقة على إعلانك وظهر للجميع', `/listings/${params.id}`);
  }

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

// احتساب عمولة البيع وتوزيعها (سجل إتمام البيع): على البائع، ونصيب الدلال والمشرف
async function recordCommission(listingId: string, sellerId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      price: true,
      auction: {
        select: {
          brokerId: true,
          type: { select: { commissionPct: true } },
          bids: { orderBy: { amount: 'desc' }, take: 1, select: { amount: true } },
        },
      },
    },
  });
  if (!listing) return;

  const cfg = await getCommissionConfig();
  // عمولة السوق من الإعدادات، وإلا عمولة نوع المزاد
  const pct = cfg.marketCommissionPct || listing.auction?.type?.commissionPct || 0;
  if (!pct) return;

  const finalAmount = listing.auction?.bids?.[0]?.amount ?? listing.price;
  if (!finalAmount) return;

  const commission = new Prisma.Decimal(finalAmount).mul(pct).div(100);
  if (commission.lte(0)) return;

  // تفادي التكرار
  const existing = await prisma.walletTxn.findFirst({ where: { type: 'COMMISSION', refId: listingId } });
  if (existing) return;

  // عمولة السوق في ذمة البائع (سالبة)
  await prisma.walletTxn.create({
    data: { userId: sellerId, type: 'COMMISSION', amount: commission.negated(), refId: listingId,
      note: `عمولة السوق (${pct}%) على بيع الإعلان` },
  });

  // نصيب الدلال من العمولة (موجب)
  const brokerId = listing.auction?.brokerId;
  if (brokerId) {
    const broker = await prisma.user.findUnique({ where: { id: brokerId }, select: { brokerSharePct: true } });
    const bPct = broker?.brokerSharePct ?? cfg.brokerSharePct;
    if (bPct > 0) {
      const share = commission.mul(bPct).div(100);
      await prisma.walletTxn.create({
        data: { userId: brokerId, type: 'BROKER_SHARE', amount: share, refId: listingId,
          note: `نصيب الدلال (${bPct}% من العمولة)` },
      });
      await notify(brokerId, 'EARNING', `💰 أُضيف نصيبك ${share.toFixed(0)} ﷼ من عمولة بيع إعلان`, '/wallet');
    }
  }

  // نصيب مشرف الدلالين من العمولة (موجب)
  if (cfg.supervisorSharePct > 0) {
    const sup = await prisma.user.findFirst({ where: { accountType: 'BROKERS_LEAD' }, select: { id: true } });
    if (sup) {
      const share = commission.mul(cfg.supervisorSharePct).div(100);
      await prisma.walletTxn.create({
        data: { userId: sup.id, type: 'SUPERVISOR_SHARE', amount: share, refId: listingId,
          note: `نصيب مشرف الدلالين (${cfg.supervisorSharePct}% من العمولة)` },
      });
      await notify(sup.id, 'EARNING', `💰 أُضيف نصيبك ${share.toFixed(0)} ﷼ كمشرف دلالين من عمولة بيع`, '/wallet');
    }
  }
}

// حذف إعلان (إدارة) — يُمنع أثناء وجود نزاع مفتوح لحفظ الأدلّة
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const openDispute = await prisma.dispute.count({
    where: { listingId: params.id, status: { in: ['OPEN', 'REVIEWING'] } },
  }).catch(() => 0);
  if (openDispute > 0) {
    return json({ message: 'لا يمكن حذف الإعلان أثناء وجود نزاع مفتوح — يُحفظ لأغراض التوثيق.' }, 400);
  }

  await prisma.listing.delete({ where: { id: params.id } });
  return json({ ok: true });
}
