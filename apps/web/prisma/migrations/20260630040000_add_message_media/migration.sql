-- صورة/صوت + تفريغ نصّي للرسائل — إضافة غير هدّامة

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "transcript" TEXT;
