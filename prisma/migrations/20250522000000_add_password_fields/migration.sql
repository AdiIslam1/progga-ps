-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Parent" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
