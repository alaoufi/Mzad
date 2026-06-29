-- مركز النزاعات — إضافة غير هدّامة

CREATE TABLE IF NOT EXISTS "Dispute" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "openedById" TEXT NOT NULL,
    "againstId" TEXT,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Dispute_status_createdAt_idx" ON "Dispute"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Dispute_openedById_idx" ON "Dispute"("openedById");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Dispute_openedById_fkey') THEN
    ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey"
      FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Dispute_listingId_fkey') THEN
    ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
