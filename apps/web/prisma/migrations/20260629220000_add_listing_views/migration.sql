-- عدّاد مشاهدات الإعلان — إضافة غير هدّامة

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
