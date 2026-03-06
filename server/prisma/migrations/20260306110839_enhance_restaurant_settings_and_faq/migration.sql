/*
  Warnings:

  - You are about to drop the column `description` on the `RestaurantSetting` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FAQ" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_FAQ" ("answer", "createdAt", "id", "isActive", "question", "updatedAt") SELECT "answer", "createdAt", "id", "isActive", "question", "updatedAt" FROM "FAQ";
DROP TABLE "FAQ";
ALTER TABLE "new_FAQ" RENAME TO "FAQ";
CREATE INDEX "FAQ_category_isActive_idx" ON "FAQ"("category", "isActive");
CREATE INDEX "FAQ_isActive_sortOrder_idx" ON "FAQ"("isActive", "sortOrder");
CREATE TABLE "new_RestaurantSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "group" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_RestaurantSetting" ("key", "updatedAt", "value") SELECT "key", "updatedAt", "value" FROM "RestaurantSetting";
DROP TABLE "RestaurantSetting";
ALTER TABLE "new_RestaurantSetting" RENAME TO "RestaurantSetting";
CREATE INDEX "RestaurantSetting_group_idx" ON "RestaurantSetting"("group");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
