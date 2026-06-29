import { prisma } from '@/lib/prisma';

// صلاحية الإشراف على الدلالين: الإدارة أو كبير الدلالين
export async function canSupervise(authSub: string, role: string): Promise<boolean> {
  if (role === 'ADMIN') return true;
  const u = await prisma.user.findUnique({ where: { id: authSub }, select: { accountType: true } });
  return u?.accountType === 'BROKERS_LEAD';
}

// هل التصنيف ضمن نطاق الدلال؟ (نطاق فارغ = صلاحية كاملة، توافقاً للخلف)
// التصنيف داخل النطاق إن كان هو أو أحد آبائه ضمن التصنيفات المُسندة.
export async function isInBrokerScope(categoryId: string | null | undefined, scopeIds: string[]): Promise<boolean> {
  if (!scopeIds || scopeIds.length === 0) return true;
  if (!categoryId) return false;
  const set = new Set(scopeIds);
  let cur: string | null = categoryId;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    if (set.has(cur)) return true;
    seen.add(cur);
    const c: { parentId: string | null } | null = await prisma.category.findUnique({
      where: { id: cur }, select: { parentId: true },
    });
    cur = c?.parentId ?? null;
  }
  return false;
}
