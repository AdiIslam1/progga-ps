-- Friday is the only weekly closure. Replace the enum atomically and preserve
-- every existing lesson by translating Friday schedules to Sunday.
CREATE TYPE "Day_new" AS ENUM (
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'SAT',
  'SUNDAY'
);

ALTER TABLE "Lesson"
ALTER COLUMN "day" TYPE "Day_new"
USING (
  CASE
    WHEN "day"::text = 'FRIDAY' THEN 'SUNDAY'
    ELSE "day"::text
  END
)::"Day_new";

DROP TYPE "Day";
ALTER TYPE "Day_new" RENAME TO "Day";
