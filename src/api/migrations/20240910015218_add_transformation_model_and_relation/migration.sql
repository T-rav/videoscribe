/*
  Warnings:

  - You are about to drop the column `transform` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `transform` on the `Transcription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "transform";

-- AlterTable
ALTER TABLE "Transcription" DROP COLUMN "transform";

-- CreateTable
CREATE TABLE "Transformation" (
    "id" SERIAL NOT NULL,
    "transcriptionId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "cts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ets" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transformation_id_idx" ON "Transformation"("id");

-- CreateIndex
CREATE INDEX "Transformation_transcriptionId_idx" ON "Transformation"("transcriptionId");

-- AddForeignKey
ALTER TABLE "Transformation" ADD CONSTRAINT "Transformation_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "Transcription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
