-- استهداف الإعلان بالأقسام/التصنيفات — إضافة غير هدّامة
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "targetCategories" TEXT;
