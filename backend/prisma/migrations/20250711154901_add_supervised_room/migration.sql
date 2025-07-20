-- CreateTable
CREATE TABLE "SupervisedRoom" (
    "id" SERIAL NOT NULL,
    "supervisorId" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupervisedRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupervisedRoom_supervisorId_roomId_key" ON "SupervisedRoom"("supervisorId", "roomId");

-- AddForeignKey
ALTER TABLE "SupervisedRoom" ADD CONSTRAINT "SupervisedRoom_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisedRoom" ADD CONSTRAINT "SupervisedRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
