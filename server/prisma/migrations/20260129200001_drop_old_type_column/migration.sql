-- Drop old type column and index
DROP INDEX IF EXISTS "CalendarEvent_type_idx";
ALTER TABLE "CalendarEvent" DROP COLUMN "type";
