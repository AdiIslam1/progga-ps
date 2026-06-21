-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "semEndDate" TIMESTAMP(3),
ADD COLUMN     "semStartDate" TIMESTAMP(3),
ADD COLUMN     "semesterNumber" INTEGER,
ADD COLUMN     "year" INTEGER;

-- AlterTable
ALTER TABLE "ReportCard" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "culturalFunction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mathOlympiad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moralBehavior" TEXT,
ADD COLUMN     "scoutBnc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sports" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "term" SET DEFAULT '',
ALTER COLUMN "gpa" SET DEFAULT 0,
ALTER COLUMN "grade" SET DEFAULT 'F',
ALTER COLUMN "year" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "oralScore" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "admissionYear" INTEGER,
ADD COLUMN     "birthDistrict" TEXT,
ADD COLUMN     "birthRegNo" TEXT,
ADD COLUMN     "birthThana" TEXT,
ADD COLUMN     "birthUpazila" TEXT,
ADD COLUMN     "birthVillage" TEXT,
ADD COLUMN     "fatherAddress" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "fatherNameEn" TEXT,
ADD COLUMN     "fatherNid" TEXT,
ADD COLUMN     "fatherPhone" TEXT,
ADD COLUMN     "fatherUpazila" TEXT,
ADD COLUMN     "fatherWorkAddress" TEXT,
ADD COLUMN     "group" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "motherNameEn" TEXT,
ADD COLUMN     "motherNid" TEXT,
ADD COLUMN     "nameBn" TEXT,
ADD COLUMN     "permDistrict" TEXT,
ADD COLUMN     "permThana" TEXT,
ADD COLUMN     "permUpazila" TEXT,
ADD COLUMN     "permVillage" TEXT,
ADD COLUMN     "prevPassMarks" INTEGER,
ADD COLUMN     "prevSchoolClass" TEXT,
ADD COLUMN     "prevSchoolName" TEXT,
ADD COLUMN     "prevSchoolRoll" TEXT,
ADD COLUMN     "prevSchoolSection" TEXT,
ADD COLUMN     "prevSession" TEXT,
ADD COLUMN     "prevSubjectCount" INTEGER,
ADD COLUMN     "prevTutors" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "rollNo" INTEGER,
ADD COLUMN     "shift" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_studentId_academicYear_key" ON "ReportCard"("studentId", "academicYear");
