-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "qid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "cts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ets" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_qid_key" ON "User"("qid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
