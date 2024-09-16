/*
  Warnings:

  - Added the required column `transform` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "transform" TEXT NOT NULL;
