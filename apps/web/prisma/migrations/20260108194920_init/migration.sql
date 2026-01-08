-- CreateTable
CREATE TABLE "Bead" (
    "id" SERIAL NOT NULL,
    "colorCode" TEXT NOT NULL,
    "name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "threshold" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockChange" (
    "id" SERIAL NOT NULL,
    "beadId" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Bead_colorCode_key" ON "Bead"("colorCode");

-- AddForeignKey
ALTER TABLE "StockChange" ADD CONSTRAINT "StockChange_beadId_fkey" FOREIGN KEY ("beadId") REFERENCES "Bead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
