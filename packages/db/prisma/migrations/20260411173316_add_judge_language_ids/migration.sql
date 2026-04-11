-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "aggregatorLanguageId" INTEGER,
ADD COLUMN     "checkerLanguageId" INTEGER;

-- AlterTable
ALTER TABLE "TestCase" ADD COLUMN     "checkerLanguageId" INTEGER;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_checkerLanguageId_fkey" FOREIGN KEY ("checkerLanguageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_aggregatorLanguageId_fkey" FOREIGN KEY ("aggregatorLanguageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_checkerLanguageId_fkey" FOREIGN KEY ("checkerLanguageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;
