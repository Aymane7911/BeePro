/*
  Warnings:

  - The primary key for the `Batch` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `name` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Apiary" DROP CONSTRAINT "Apiary_batchId_fkey";

-- AlterTable
ALTER TABLE "Apiary" ALTER COLUMN "batchId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Batch" DROP CONSTRAINT "Batch_pkey",
ADD COLUMN     "bothCertifications" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "bothCertificationsPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "certificationDate" TEXT,
ADD COLUMN     "completedChecks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "containerType" TEXT NOT NULL DEFAULT 'Glass',
ADD COLUMN     "expiryDate" TEXT,
ADD COLUMN     "jarsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "labelType" TEXT NOT NULL DEFAULT 'Standard',
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "originOnly" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "originOnlyPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qualityOnly" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "qualityOnlyPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "totalChecks" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "uncertified" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "uncertifiedPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD COLUMN     "weightKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Batch_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Batch_id_seq";

-- CreateTable
CREATE TABLE "TokenStats" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "remainingTokens" INTEGER NOT NULL DEFAULT 0,
    "originOnly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityOnly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bothCertifications" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TokenStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenStats_userId_key" ON "TokenStats"("userId");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "beeusers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenStats" ADD CONSTRAINT "TokenStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "beeusers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apiary" ADD CONSTRAINT "Apiary_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
