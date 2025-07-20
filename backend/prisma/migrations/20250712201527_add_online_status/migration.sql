/*
  Warnings:

  - You are about to drop the column `studentId` on the `OnlineStatus` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `OnlineStatus` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `OnlineStatus` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OnlineStatus_studentId_key";

-- AlterTable
ALTER TABLE "OnlineStatus" DROP COLUMN "studentId",
ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OnlineStatus_userId_key" ON "OnlineStatus"("userId");

-- AddForeignKey
ALTER TABLE "OnlineStatus" ADD CONSTRAINT "OnlineStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
