-- Abort with a clear error instead of failing partway through index creation if
-- duplicate data was introduced after the pre-deployment audit.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Result"
    WHERE "examId" IS NOT NULL AND "subjectId" IS NOT NULL
    GROUP BY "studentId", "examId", "subjectId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate exam results must be resolved before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "Attendance"
    GROUP BY "studentId", "date"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate attendance records must be resolved before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "FeeCollection"
    WHERE "feePackageId" IS NOT NULL
    GROUP BY "studentId", "feePackageId", "month"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate packaged fees must be resolved before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SalaryCollection"
    WHERE "type" = 'SALARY'
    GROUP BY "teacherId", "month"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate monthly salaries must be resolved before applying this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "SalaryCollection"
    WHERE "type" = 'BONUS' AND "bonusPackageId" IS NOT NULL
    GROUP BY "teacherId", "month", "bonusPackageId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate bonus applications must be resolved before applying this migration.';
  END IF;
END $$;

CREATE UNIQUE INDEX "Result_studentId_examId_subjectId_key"
ON "Result"("studentId", "examId", "subjectId");

CREATE UNIQUE INDEX "Attendance_studentId_date_key"
ON "Attendance"("studentId", "date");

-- NULLS NOT DISTINCT prevents duplicate one-time package bills where month is
-- null, while the predicate leaves custom fees without a package unrestricted.
CREATE UNIQUE INDEX "FeeCollection_student_package_month_key"
ON "FeeCollection"("studentId", "feePackageId", "month") NULLS NOT DISTINCT
WHERE "feePackageId" IS NOT NULL;

CREATE UNIQUE INDEX "SalaryCollection_teacher_month_salary_key"
ON "SalaryCollection"("teacherId", "month")
WHERE "type" = 'SALARY';

CREATE UNIQUE INDEX "SalaryCollection_teacher_month_bonus_key"
ON "SalaryCollection"("teacherId", "month", "bonusPackageId")
WHERE "type" = 'BONUS' AND "bonusPackageId" IS NOT NULL;
