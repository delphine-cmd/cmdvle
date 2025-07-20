/*
  Warnings:

  - Made the column `stackId` on table `Folder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "stackId" SET NOT NULL;
