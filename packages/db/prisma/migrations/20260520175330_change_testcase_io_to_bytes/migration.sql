-- AlterTable (Safe migration to preserve data using convert_to)
ALTER TABLE "TestCase" 
  ALTER COLUMN "input" TYPE BYTEA USING convert_to("input", 'UTF8'),
  ALTER COLUMN "output" TYPE BYTEA USING convert_to("output", 'UTF8');
