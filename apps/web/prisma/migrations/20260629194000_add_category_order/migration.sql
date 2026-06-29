-- ترتيب التصنيفات (للسحب/الترتيب اليدوي) — إضافة غير هدّامة

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
