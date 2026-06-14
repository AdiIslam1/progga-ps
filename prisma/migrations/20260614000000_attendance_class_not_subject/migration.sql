-- Drop existing foreign key and subjectId column
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_subjectId_fkey";

-- Add classId as nullable first (to handle existing rows)
ALTER TABLE "Attendance" ADD COLUMN "classId" INTEGER;

-- Backfill classId from the student's class
UPDATE "Attendance" a
SET "classId" = s."classId"
FROM "Student" s
WHERE a."studentId" = s.id;

-- Now make classId NOT NULL
ALTER TABLE "Attendance" ALTER COLUMN "classId" SET NOT NULL;

-- Drop subjectId
ALTER TABLE "Attendance" DROP COLUMN "subjectId";

-- Add foreign key constraint
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey"
  FOREIGN KEY ("classId") REFERENCES "Class"(id) ON DELETE CASCADE ON UPDATE CASCADE;
