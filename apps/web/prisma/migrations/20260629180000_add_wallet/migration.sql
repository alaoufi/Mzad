-- المحفظة والسجل المالي — إضافة غير هدّامة

CREATE TABLE IF NOT EXISTS "WalletTxn" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTxn_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WalletTxn_userId_createdAt_idx" ON "WalletTxn"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'WalletTxn_userId_fkey'
  ) THEN
    ALTER TABLE "WalletTxn"
      ADD CONSTRAINT "WalletTxn_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
