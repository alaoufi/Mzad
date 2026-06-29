import { prisma } from '@/lib/prisma';
import { json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// الإعدادات العامة المرئية (وضع الدخول: عام/متخصص)
export async function GET() {
  try {
    const rows = await prisma.appSetting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return json({ entryMode: map.entryMode === 'SPECIALIZED' ? 'SPECIALIZED' : 'GENERAL' });
  } catch {
    return json({ entryMode: 'GENERAL' });
  }
}
