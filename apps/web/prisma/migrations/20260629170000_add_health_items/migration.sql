-- إضافة بنود الحالة الصحية القابلة للإدارة + حقل النص على سمات الإعلان (إضافات غير هدّامة)

-- AlterTable: حقل النص الاختياري على سمة الحالة الصحية للإعلان
ALTER TABLE "HealthAttribute" ADD COLUMN IF NOT EXISTS "label" TEXT;

-- CreateTable: بنود الحالة الصحية المُدارة من الإدارة
CREATE TABLE IF NOT EXISTS "HealthItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HealthItem_hidden_order_idx" ON "HealthItem"("hidden", "order");
