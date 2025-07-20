/*
  Warnings:

  - Made the column `hashedPassword` on table `PasswordResetToken` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "PasswordResetToken" ALTER COLUMN "hashedPassword" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;
