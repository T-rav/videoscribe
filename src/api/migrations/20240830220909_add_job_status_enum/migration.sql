/*
  Warnings:

  - Added the required column `contentName` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transcriptionType` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transform` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('finished', 'pending', 'failed', 'in_progress');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "contentName" TEXT NOT NULL,
ADD COLUMN     "status" "JobStatus" NOT NULL,
ADD COLUMN     "transcriptionType" TEXT NOT NULL,
ADD COLUMN     "transform" TEXT NOT NULL;
