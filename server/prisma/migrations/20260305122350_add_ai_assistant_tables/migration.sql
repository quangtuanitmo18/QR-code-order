-- AlterTable
ALTER TABLE "Dish" ADD COLUMN "allergens" TEXT;
ALTER TABLE "Dish" ADD COLUMN "ingredients" TEXT;
ALTER TABLE "Dish" ADD COLUMN "tags" TEXT;

-- AlterTable
ALTER TABLE "DishSnapshot" ADD COLUMN "allergens" TEXT;
ALTER TABLE "DishSnapshot" ADD COLUMN "ingredients" TEXT;
ALTER TABLE "DishSnapshot" ADD COLUMN "tags" TEXT;

-- CreateTable
CREATE TABLE "RestaurantSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
