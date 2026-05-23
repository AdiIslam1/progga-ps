-- CreateEnum
CREATE TYPE "FeePackageType" AS ENUM ('TUITION', 'OTHER_FEE');

-- AlterTable
ALTER TABLE "FeePackage" ADD COLUMN     "type" "FeePackageType" NOT NULL DEFAULT 'OTHER_FEE';
