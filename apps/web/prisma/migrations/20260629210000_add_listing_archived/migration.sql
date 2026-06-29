-- أرشفة الإعلان من البائع — إضافة غير هدّامة

ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
