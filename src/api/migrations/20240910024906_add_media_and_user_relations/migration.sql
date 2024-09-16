/*
  Warnings:

  - You are about to drop the column `details` on the `Transformation` table. All the data in the column will be lost.
  - Added the required column `blobUrl` to the `Transcription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blobUrl` to the `Transformation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transcription" ADD COLUMN     "blobUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transformation" DROP COLUMN "details",
ADD COLUMN     "blobUrl" TEXT NOT NULL;
