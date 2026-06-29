-- محادثة خاصة بين المشتري والبائع — إضافة غير هدّامة

ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "buyerId" TEXT;
CREATE INDEX IF NOT EXISTS "Conversation_buyerId_idx" ON "Conversation"("buyerId");
