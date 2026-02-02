-- CreateTable
CREATE TABLE "CalendarType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'bg-blue-500',
    "category" TEXT NOT NULL DEFAULT 'personal',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarType_name_key" UNIQUE ("name"),
    CONSTRAINT "CalendarType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Account" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);

-- CreateIndex
CREATE INDEX "CalendarType_category_idx" ON "CalendarType"("category");
CREATE INDEX "CalendarType_visible_idx" ON "CalendarType"("visible");
CREATE INDEX "CalendarType_createdById_idx" ON "CalendarType"("createdById");

-- Insert default calendar types (only if Account with id=1 exists to avoid FK errors)
INSERT INTO "CalendarType" ("name", "label", "color", "category", "visible", "createdById", "createdAt", "updatedAt")
SELECT 
    'work_shift' as "name",
    'Work Shifts' as "label",
    'bg-blue-500' as "color",
    'work' as "category",
    1 as "visible",
    1 as "createdById",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
WHERE EXISTS (SELECT 1 FROM "Account" WHERE "id" = 1)
  AND NOT EXISTS (SELECT 1 FROM "CalendarType" WHERE "name" = 'work_shift');

INSERT INTO "CalendarType" ("name", "label", "color", "category", "visible", "createdById", "createdAt", "updatedAt")
SELECT 
    'meeting' as "name",
    'Meetings' as "label",
    'bg-green-500' as "color",
    'work' as "category",
    1 as "visible",
    1 as "createdById",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
WHERE EXISTS (SELECT 1 FROM "Account" WHERE "id" = 1)
  AND NOT EXISTS (SELECT 1 FROM "CalendarType" WHERE "name" = 'meeting');

INSERT INTO "CalendarType" ("name", "label", "color", "category", "visible", "createdById", "createdAt", "updatedAt")
SELECT 
    'personal' as "name",
    'Personal' as "label",
    'bg-pink-500' as "color",
    'personal' as "category",
    1 as "visible",
    1 as "createdById",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
WHERE EXISTS (SELECT 1 FROM "Account" WHERE "id" = 1)
  AND NOT EXISTS (SELECT 1 FROM "CalendarType" WHERE "name" = 'personal');

INSERT INTO "CalendarType" ("name", "label", "color", "category", "visible", "createdById", "createdAt", "updatedAt")
SELECT 
    'holiday' as "name",
    'Holidays' as "label",
    'bg-red-500' as "color",
    'shared' as "category",
    1 as "visible",
    1 as "createdById",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
WHERE EXISTS (SELECT 1 FROM "Account" WHERE "id" = 1)
  AND NOT EXISTS (SELECT 1 FROM "CalendarType" WHERE "name" = 'holiday');

INSERT INTO "CalendarType" ("name", "label", "color", "category", "visible", "createdById", "createdAt", "updatedAt")
SELECT 
    'birthday' as "name",
    'Birthdays' as "label",
    'bg-purple-500' as "color",
    'shared' as "category",
    1 as "visible",
    1 as "createdById",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
WHERE EXISTS (SELECT 1 FROM "Account" WHERE "id" = 1)
  AND NOT EXISTS (SELECT 1 FROM "CalendarType" WHERE "name" = 'birthday');

INSERT INTO "CalendarType" ("name", "label", "color", "category", "visible", "createdById", "createdAt", "updatedAt")
SELECT 
    'company_event' as "name",
    'Company Events' as "label",
    'bg-orange-500' as "color",
    'shared' as "category",
    1 as "visible",
    1 as "createdById",
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
WHERE EXISTS (SELECT 1 FROM "Account" WHERE "id" = 1)
  AND NOT EXISTS (SELECT 1 FROM "CalendarType" WHERE "name" = 'company_event');

-- Add typeId column to CalendarEvent (nullable first)
ALTER TABLE "CalendarEvent" ADD COLUMN "typeId" INTEGER;

-- Migrate existing data: map type string to typeId
UPDATE "CalendarEvent" 
SET "typeId" = (
    SELECT "id" FROM "CalendarType" 
    WHERE "CalendarType"."name" = "CalendarEvent"."type"
    LIMIT 1
)
WHERE "typeId" IS NULL;

-- Make typeId NOT NULL after migration
-- First, set default for any remaining NULL values (shouldn't happen if all types exist)
UPDATE "CalendarEvent" 
SET "typeId" = (SELECT "id" FROM "CalendarType" WHERE "name" = 'personal' LIMIT 1)
WHERE "typeId" IS NULL;

-- Add foreign key constraint
CREATE INDEX "CalendarEvent_typeId_idx" ON "CalendarEvent"("typeId");

-- Drop old type index and column (keep for now, will drop in next step)
-- ALTER TABLE "CalendarEvent" DROP COLUMN "type";
