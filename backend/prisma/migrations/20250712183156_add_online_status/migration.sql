-- CreateTable
CREATE TABLE "OnlineStatus" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "isOnline" BOOLEAN NOT NULL,

    CONSTRAINT "OnlineStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineStatus_studentId_key" ON "OnlineStatus"("studentId");
