-- CreateTable
CREATE TABLE "Bubble" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "roomId" INTEGER NOT NULL,

    CONSTRAINT "Bubble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BubbleStudents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BubbleStudents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BubbleSupervisors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BubbleSupervisors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BubbleStudents_B_index" ON "_BubbleStudents"("B");

-- CreateIndex
CREATE INDEX "_BubbleSupervisors_B_index" ON "_BubbleSupervisors"("B");

-- AddForeignKey
ALTER TABLE "Bubble" ADD CONSTRAINT "Bubble_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BubbleStudents" ADD CONSTRAINT "_BubbleStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "Bubble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BubbleStudents" ADD CONSTRAINT "_BubbleStudents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BubbleSupervisors" ADD CONSTRAINT "_BubbleSupervisors_A_fkey" FOREIGN KEY ("A") REFERENCES "Bubble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BubbleSupervisors" ADD CONSTRAINT "_BubbleSupervisors_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
