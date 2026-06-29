import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';
import { DEFAULT_COMMISSION_NOTE } from '@/lib/commission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// الإعدادات العامة المرئية (وضع الدخول + العمولة وإفصاحها)
export async function GET() {
  try {
    const rows = await prisma.appSetting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return json({
      entryMode: map.entryMode === 'SPECIALIZED' ? 'SPECIALIZED' : 'GENERAL',
      marketCommissionPct: Number(map.marketCommissionPct ?? 0) || 0,
      commissionNote: map.commissionNote || DEFAULT_COMMISSION_NOTE,
    });
  } catch {
    return json({ entryMode: 'GENERAL', marketCommissionPct: 0, commissionNote: DEFAULT_COMMISSION_NOTE });
  }
}
