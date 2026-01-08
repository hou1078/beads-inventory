-- CreateTable
CREATE TABLE "Bead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "colorCode" TEXT NOT NULL,
    "name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "threshold" INTEGER NOT NULL DEFAULT 200,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StockChange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "beadId" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockChange_beadId_fkey" FOREIGN KEY ("beadId") REFERENCES "Bead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Bead_colorCode_key" ON "Bead"("colorCode");
