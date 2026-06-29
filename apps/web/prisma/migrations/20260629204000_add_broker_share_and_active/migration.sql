-- نسبة الدلال من العمولة + تفعيل/تعطيل الحساب — إضافات غير هدّامة

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "brokerSharePct" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
