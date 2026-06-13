/*
  Warnings:

  - You are about to drop the column `lessonId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `gradeId` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `lessonId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `term` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `gradeId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the `Grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Parent` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[studentId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,classId]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teacherId]` on the table `Teacher` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subjectId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `ExamSchedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SalaryStatus" AS ENUM ('PAID', 'UNPAID');

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_parentId_fkey";

-- DropIndex
DROP INDEX "Student_email_key";

-- DropIndex
DROP INDEX "Student_username_key";

-- DropIndex
DROP INDEX "Subject_name_key";

-- DropIndex
DROP INDEX "Teacher_username_key";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "lessonId",
ADD COLUMN     "subjectId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "gradeId";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "endTime",
DROP COLUMN "lessonId",
DROP COLUMN "startTime",
DROP COLUMN "term";

-- AlterTable
ALTER TABLE "ExamSchedule" ADD COLUMN     "classId" INTEGER NOT NULL,
ADD COLUMN     "totalMarks" INTEGER NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "recipientCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "subjectId" INTEGER;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "email",
DROP COLUMN "gradeId",
DROP COLUMN "parentId",
DROP COLUMN "username",
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "guardianPhone" TEXT,
ADD COLUMN     "studentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "classId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "username",
ADD COLUMN     "monthlySalary" DOUBLE PRECISION,
ADD COLUMN     "teacherId" SERIAL NOT NULL;

-- DropTable
DROP TABLE "Grade";

-- DropTable
DROP TABLE "Parent";

-- CreateTable
CREATE TABLE "SalaryCollection" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "month" TEXT NOT NULL,
    "status" "SalaryStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "receiptNo" TEXT,
    "receivedById" TEXT,

    CONSTRAINT "SalaryCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryCollection_receiptNo_key" ON "SalaryCollection"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_classId_key" ON "Subject"("name", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_teacherId_key" ON "Teacher"("teacherId");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryCollection" ADD CONSTRAINT "SalaryCollection_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
