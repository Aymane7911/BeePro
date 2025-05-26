-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apiary" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "hiveCount" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "batchId" INTEGER NOT NULL,

    CONSTRAINT "Apiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");

-- AddForeignKey
ALTER TABLE "Apiary" ADD CONSTRAINT "Apiary_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
