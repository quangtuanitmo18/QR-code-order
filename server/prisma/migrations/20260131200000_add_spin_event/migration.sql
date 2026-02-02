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

-- Add eventId column to SpinReward (if table exists and column doesn't exist)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we'll try to add it
-- If it fails, the column already exists (we'll handle manually)
ALTER TABLE "SpinReward" ADD COLUMN "eventId" INTEGER;

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

-- CreateIndex for SpinReward eventId
CREATE INDEX IF NOT EXISTS "SpinReward_eventId_isActive_idx" ON "SpinReward"("eventId", "isActive");

-- Add eventId column to EmployeeSpin (if table exists)
ALTER TABLE "EmployeeSpin" ADD COLUMN "eventId" INTEGER;

-- CreateIndex for EmployeeSpin eventId
CREATE INDEX IF NOT EXISTS "EmployeeSpin_eventId_idx" ON "EmployeeSpin"("eventId");
