-- تثبيت محاور هوية القسم يدوياً (نمط/استدارة/تخطيط/بطاقة) — إضافة غير هدّامة

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "motifKey" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "shapeKey" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "layoutKey" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "cardStyle" TEXT;
