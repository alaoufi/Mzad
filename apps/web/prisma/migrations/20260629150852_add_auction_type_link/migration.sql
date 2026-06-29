-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "typeId" TEXT;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "AuctionType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
