/*
  Warnings:

  - You are about to drop the column `jobId` on the `Media` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mediaId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_jobId_fkey";

-- DropIndex
DROP INDEX "Media_jobId_idx";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "mediaId" INTEGER;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "jobId";

-- CreateIndex
CREATE UNIQUE INDEX "Job_mediaId_key" ON "Job"("mediaId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
