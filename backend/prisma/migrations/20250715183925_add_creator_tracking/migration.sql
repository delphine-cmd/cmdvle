/*
  Warnings:

  - Added the required column `creatorId` to the `Folder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- 1. Add nullable creatorId columns first
ALTER TABLE "Folder"
ADD COLUMN "creatorId" INTEGER;

ALTER TABLE "Project"
ADD COLUMN "creatorId" INTEGER;

-- 2. Backfill existing records: set creatorId to a valid user id (replace 1 with your real user id)
UPDATE "Folder" SET "creatorId" = 1 WHERE "creatorId" IS NULL;
UPDATE "Project" SET "creatorId" = 1 WHERE "creatorId" IS NULL;

-- 3. Alter columns to set NOT NULL constraint
ALTER TABLE "Folder"
ALTER COLUMN "creatorId" SET NOT NULL;

ALTER TABLE "Project"
ALTER COLUMN "creatorId" SET NOT NULL;

-- 4. Add foreign key constraints (optional)
ALTER TABLE "Folder"
ADD CONSTRAINT "Folder_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Project"
ADD CONSTRAINT "Project_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"(id) ON DELETE CASCADE;
