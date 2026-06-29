-- اهتمامات المستخدم (معرّفات تصنيفات) — إضافة غير هدّامة

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "interests" TEXT[] NOT NULL DEFAULT '{}';
