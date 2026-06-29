import { prisma } from '@/lib/prisma';

// إنشاء إشعار لمستخدم (لا يُفشل العملية الأصلية عند الخطأ)
export async function notify(userId: string, type: string, message: string, link?: string) {
  try {
    await prisma.notification.create({ data: { userId, type, message, link: link ?? null } });
  } catch { /* تجاهل */ }
}
