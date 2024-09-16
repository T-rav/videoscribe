/*
  Warnings:

  - You are about to drop the column `contentDuration` on the `Job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Job" DROP COLUMN "contentDuration";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "duration" INTEGER;
