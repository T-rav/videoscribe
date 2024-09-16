/*
  Warnings:

  - You are about to drop the column `blobUrl` on the `Transcription` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `Transcription` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Transcription` table. All the data in the column will be lost.
  - Added the required column `mediaId` to the `Transcription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaId` to the `Transformation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transcription" DROP CONSTRAINT "Transcription_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Transcription" DROP CONSTRAINT "Transcription_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transformation" DROP CONSTRAINT "Transformation_transcriptionId_fkey";

-- DropIndex
DROP INDEX "Transcription_jobId_idx";

-- DropIndex
DROP INDEX "Transcription_userId_idx";

-- AlterTable
ALTER TABLE "Transcription" DROP COLUMN "blobUrl",
DROP COLUMN "jobId",
DROP COLUMN "userId",
ADD COLUMN     "mediaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transformation" ADD COLUMN     "mediaId" INTEGER NOT NULL,
ALTER COLUMN "transcriptionId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "qid" TEXT NOT NULL,
    "jobId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "mediaType" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "cts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ets" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_qid_key" ON "Media"("qid");

-- CreateIndex
CREATE INDEX "Media_jobId_idx" ON "Media"("jobId");

-- CreateIndex
CREATE INDEX "Media_userId_idx" ON "Media"("userId");

-- CreateIndex
CREATE INDEX "Media_id_idx" ON "Media"("id");

-- CreateIndex
CREATE INDEX "Transcription_mediaId_idx" ON "Transcription"("mediaId");

-- CreateIndex
CREATE INDEX "Transformation_mediaId_idx" ON "Transformation"("mediaId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcription" ADD CONSTRAINT "Transcription_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transformation" ADD CONSTRAINT "Transformation_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transformation" ADD CONSTRAINT "Transformation_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "Transcription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
