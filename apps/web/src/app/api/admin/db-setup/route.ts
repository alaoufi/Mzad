import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, json } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// تهيئة قاعدة البيانات: يطبّق الأعمدة الناقصة بأمان (IF NOT EXISTS) — للإدارة فقط.
// بديل عن هجرات prisma عند تعذّرها على الـ pooler. الأوامر ثابتة (لا مدخلات مستخدم).
const STATEMENTS = [
  // حقول المستخدم الإضافية
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "experienceYears" INTEGER`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankName" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT`,
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "iban" TEXT`,
  // حقول النزاعات
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "category" TEXT`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "amount" DECIMAL(12,2)`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "incidentAt" TIMESTAMP(3)`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "desired" TEXT`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "contact" TEXT`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "evidence" TEXT[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "transferRef" TEXT`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "witnesses" TEXT`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "declared" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "response" TEXT`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "responseEvidence" TEXT[] NOT NULL DEFAULT '{}'`,
  `ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3)`,
];

export async function POST(req: NextRequest) {
  const auth = getUser(req);
  if (!auth) return json({ message: 'غير مصرّح' }, 401);
  if (auth.role !== 'ADMIN') return json({ message: 'للإدارة فقط' }, 403);

  const results: { sql: string; ok: boolean; error?: string }[] = [];
  for (const s of STATEMENTS) {
    try { await prisma.$executeRawUnsafe(s); results.push({ sql: s, ok: true }); }
    catch (e: any) { results.push({ sql: s, ok: false, error: e?.message ?? 'خطأ' }); }
  }
  const failed = results.filter((r) => !r.ok);
  return json({ ok: failed.length === 0, applied: results.length, failed });
}
