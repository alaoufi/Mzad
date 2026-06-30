import { prisma } from '@/lib/prisma';

export const DEFAULT_COMMISSION_NOTE = 'العمولة في ذمة البائع، وتُحسب نسبتها من سعر البيع قبل إطلاق البيع.';
export const DEFAULT_ZERO_COMMISSION_NOTE = '🎉 جميع العروض والمزادات بدون عمولة حالياً.';

export interface CommissionConfig {
  marketCommissionPct: number;
  brokerSharePct: number;
  supervisorSharePct: number;
  commissionNote: string;
  zeroCommissionNote: string;
}

export async function getCommissionConfig(): Promise<CommissionConfig> {
  try {
    const rows = await prisma.appSetting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      marketCommissionPct: Number(map.marketCommissionPct ?? 0) || 0,
      brokerSharePct: Number(map.brokerSharePct ?? 0) || 0,
      supervisorSharePct: Number(map.supervisorSharePct ?? 0) || 0,
      commissionNote: map.commissionNote || DEFAULT_COMMISSION_NOTE,
      zeroCommissionNote: map.zeroCommissionNote || DEFAULT_ZERO_COMMISSION_NOTE,
    };
  } catch {
    return { marketCommissionPct: 0, brokerSharePct: 0, supervisorSharePct: 0, commissionNote: DEFAULT_COMMISSION_NOTE, zeroCommissionNote: DEFAULT_ZERO_COMMISSION_NOTE };
  }
}
