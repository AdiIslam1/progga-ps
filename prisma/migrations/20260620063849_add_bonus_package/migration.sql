-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('SALARY', 'BONUS');

-- AlterTable
ALTER TABLE "SalaryCollection" ADD COLUMN     "bonusPackageId" INTEGER,
ADD COLUMN     "type" "SalaryType" NOT NULL DEFAULT 'SALARY';

-- CreateTable
CREATE TABLE "BonusPackage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BonusPackage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SalaryCollection" ADD CONSTRAINT "SalaryCollection_bonusPackageId_fkey" FOREIGN KEY ("bonusPackageId") REFERENCES "BonusPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
