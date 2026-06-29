-- إعدادات المنصة (مفتاح/قيمة) — إضافة غير هدّامة

CREATE TABLE IF NOT EXISTS "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);
