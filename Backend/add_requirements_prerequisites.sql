-- Add requirements and prerequisites columns to courses table
ALTER TABLE "courses"
ADD COLUMN "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing courses to have empty arrays if null
UPDATE "courses"
SET "requirements" = ARRAY[]::TEXT[]
WHERE "requirements" IS NULL;

UPDATE "courses"
SET "prerequisites" = ARRAY[]::TEXT[]
WHERE "prerequisites" IS NULL;