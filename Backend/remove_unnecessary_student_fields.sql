-- Remove unnecessary fields from students table
ALTER TABLE "students"
DROP COLUMN IF EXISTS "address",
DROP COLUMN IF EXISTS "interests",
DROP COLUMN IF EXISTS "goals",
DROP COLUMN IF EXISTS "bio",
DROP COLUMN IF EXISTS "linkedIn";