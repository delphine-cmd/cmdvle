-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "titles" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "accessKey" TEXT NOT NULL,
    "supervisorKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);
