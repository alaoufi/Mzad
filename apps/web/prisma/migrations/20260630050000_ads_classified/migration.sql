-- نظام الإعلانات المبوبة: استهداف جغرافي + باقات + سقف مشاهدات + إحصائيات — إضافة غير هدّامة

ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "targetCountries" TEXT;
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "targetRegions" TEXT;
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "packageKey" TEXT;
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "priceHalalas" INTEGER;
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "maxImpressions" INTEGER;
CREATE INDEX IF NOT EXISTS "Ad_ownerId_idx" ON "Ad"("ownerId");

CREATE TABLE IF NOT EXISTS "AdStat" (
  "id" TEXT NOT NULL,
  "adId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AdStat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdStat_adId_day_key" ON "AdStat"("adId", "day");
CREATE INDEX IF NOT EXISTS "AdStat_adId_idx" ON "AdStat"("adId");
