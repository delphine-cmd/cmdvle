/*
  Warnings:

  - You are about to drop the column `projectId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_stackId_fkey";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "projectId",
ADD COLUMN     "stackId" INTEGER;

-- DropTable
DROP TABLE "Project";

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
