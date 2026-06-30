import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';
import { DEFAULT_COMMISSION_NOTE, DEFAULT_ZERO_COMMISSION_NOTE } from '@/lib/commission';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function setKey(key: string, value: string) {
  await prisma.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

// قراءة كل الإعدادات (للإدارة)
export async function GET(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);
  try {
    const rows = await prisma.appSetting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return json({
      entryMode: map.entryMode === 'SPECIALIZED' ? 'SPECIALIZED' : 'GENERAL',
      marketCommissionPct: Number(map.marketCommissionPct ?? 0) || 0,
      brokerSharePct: Number(map.brokerSharePct ?? 0) || 0,
      supervisorSharePct: Number(map.supervisorSharePct ?? 0) || 0,
      commissionNote: map.commissionNote || DEFAULT_COMMISSION_NOTE,
      zeroCommissionNote: map.zeroCommissionNote || DEFAULT_ZERO_COMMISSION_NOTE,
      reqFields: (map.reqFields || '').split(',').map((s) => s.trim()).filter(Boolean),
    });
  } catch {
    return json({ message: 'الجدول غير مهيّأ بعد (لم يُطبّق التعديل على قاعدة البيانات).' }, 503);
  }
}

// تعديل الإعدادات (وضع الدخول + العمولات + الإفصاح)
export async function PATCH(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const body = await req.json();
  if (body.entryMode !== undefined) await setKey('entryMode', body.entryMode === 'SPECIALIZED' ? 'SPECIALIZED' : 'GENERAL');

  const clampPct = (v: any) => String(Math.max(0, Math.min(100, Number(v) || 0)));
  if (body.marketCommissionPct !== undefined) await setKey('marketCommissionPct', clampPct(body.marketCommissionPct));
  if (body.brokerSharePct !== undefined) await setKey('brokerSharePct', clampPct(body.brokerSharePct));
  if (body.supervisorSharePct !== undefined) await setKey('supervisorSharePct', clampPct(body.supervisorSharePct));
  if (body.commissionNote !== undefined) await setKey('commissionNote', String(body.commissionNote).slice(0, 500));
  if (body.zeroCommissionNote !== undefined) await setKey('zeroCommissionNote', String(body.zeroCommissionNote).slice(0, 500));
  if (body.reqFields !== undefined) await setKey('reqFields', (Array.isArray(body.reqFields) ? body.reqFields.join(',') : String(body.reqFields)).slice(0, 200));

  return json({ ok: true });
}
