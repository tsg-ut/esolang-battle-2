-- CreateEnum
CREATE TYPE "JudgeType" AS ENUM ('BUILTIN', 'CUSTOM');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "aggregatorConfig" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "aggregatorName" TEXT NOT NULL DEFAULT 'DEFAULT',
ADD COLUMN     "aggregatorScript" TEXT,
ADD COLUMN     "aggregatorType" "JudgeType" NOT NULL DEFAULT 'BUILTIN',
ADD COLUMN     "checkerConfig" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "checkerName" TEXT NOT NULL DEFAULT 'EXACT',
ADD COLUMN     "checkerScript" TEXT,
ADD COLUMN     "checkerType" "JudgeType" NOT NULL DEFAULT 'BUILTIN';
