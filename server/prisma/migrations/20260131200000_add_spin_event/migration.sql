-- CreateTable (only if not exists)
CREATE TABLE IF NOT EXISTS "SpinEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpinEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON UPDATE NO ACTION
);

-- CreateIndex (only if not exists)
CREATE INDEX IF NOT EXISTS "SpinEvent_isActive_startDate_endDate_idx" ON "SpinEvent"("isActive", "startDate", "endDate");

-- Create a default event for existing rewards
-- Only create if SpinReward table exists and has data, and we have an Owner account
INSERT INTO "SpinEvent" ("name", "description", "startDate", "isActive", "createdById", "createdAt", "updatedAt")
SELECT 
    'Default Event' as "name",
    'Default event for existing rewards' as "description",
    datetime('now') as "startDate",
    1 as "isActive",
    (SELECT id FROM "Account" WHERE role = 'Owner' LIMIT 1) as "createdById",
    datetime('now') as "createdAt",
    datetime('now') as "updatedAt"
WHERE EXISTS (SELECT name FROM sqlite_master WHERE type='table' AND name='SpinReward')
  AND EXISTS (SELECT 1 FROM "Account" WHERE role = 'Owner' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM "SpinEvent" WHERE name = 'Default Event');

-- Assign all existing rewards to the default event
UPDATE "SpinReward" 
SET "eventId" = (SELECT id FROM "SpinEvent" WHERE name = 'Default Event' LIMIT 1)
WHERE "eventId" IS NULL
  AND EXISTS (SELECT 1 FROM "SpinEvent" WHERE name = 'Default Event');

-- Make eventId NOT NULL and add foreign key constraint
-- SQLite doesn't support ALTER TABLE to modify column, so we need to recreate the table
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpinReward" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" TEXT,
    "probability" REAL NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-blue-500',
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "maxQuantity" INTEGER,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "eventId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpinReward_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SpinEvent" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_SpinReward" ("id", "name", "description", "type", "value", "probability", "color", "icon", "isActive", "order", "maxQuantity", "currentQuantity", "version", "eventId", "createdAt", "updatedAt")
SELECT "id", "name", "description", "type", "value", "probability", "color", "icon", "isActive", "order", "maxQuantity", "currentQuantity", "version", COALESCE("eventId", (SELECT id FROM "SpinEvent" WHERE name = 'Default Event' LIMIT 1)), "createdAt", "updatedAt" FROM "SpinReward";
DROP TABLE "SpinReward";
ALTER TABLE "new_SpinReward" RENAME TO "SpinReward";
-- Recreate indexes
CREATE INDEX "SpinReward_isActive_order_idx" ON "SpinReward"("isActive", "order");
CREATE INDEX "SpinReward_isActive_currentQuantity_maxQuantity_idx" ON "SpinReward"("isActive", "currentQuantity", "maxQuantity");
CREATE INDEX "SpinReward_eventId_isActive_idx" ON "SpinReward"("eventId", "isActive");
PRAGMA foreign_keys=ON;

-- Add eventId column to EmployeeSpin (if table exists)
ALTER TABLE "EmployeeSpin" ADD COLUMN "eventId" INTEGER;

-- CreateIndex for EmployeeSpin eventId
CREATE INDEX IF NOT EXISTS "EmployeeSpin_eventId_idx" ON "EmployeeSpin"("eventId");
