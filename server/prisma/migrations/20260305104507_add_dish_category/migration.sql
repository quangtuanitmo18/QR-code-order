-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dish" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Uncategorized',
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dish" ("createdAt", "description", "id", "image", "name", "price", "status", "updatedAt") SELECT "createdAt", "description", "id", "image", "name", "price", "status", "updatedAt" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE TABLE "new_DishSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Uncategorized',
    "status" TEXT NOT NULL DEFAULT 'Available',
    "dishId" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DishSnapshot_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE SET NULL ON UPDATE NO ACTION
);
INSERT INTO "new_DishSnapshot" ("createdAt", "description", "dishId", "id", "image", "name", "price", "status", "updatedAt") SELECT "createdAt", "description", "dishId", "id", "image", "name", "price", "status", "updatedAt" FROM "DishSnapshot";
DROP TABLE "DishSnapshot";
ALTER TABLE "new_DishSnapshot" RENAME TO "DishSnapshot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
