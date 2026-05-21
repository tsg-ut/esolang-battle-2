-- AlterTable (Safe migration to preserve data using convert_to)
ALTER TABLE "Execution" 
  ALTER COLUMN "stdout" TYPE BYTEA USING convert_to("stdout", 'UTF8'),
  ALTER COLUMN "stderr" TYPE BYTEA USING convert_to("stderr", 'UTF8');
