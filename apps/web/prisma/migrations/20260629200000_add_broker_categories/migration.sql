-- نطاق الدلال (التصنيفات المُسندة إليه) — إضافة غير هدّامة

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "brokerCategories" TEXT[] NOT NULL DEFAULT '{}';
