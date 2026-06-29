-- AlterTable
ALTER TABLE "AuctionType" ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false;
