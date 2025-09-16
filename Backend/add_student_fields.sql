-- Add new fields to students table for comprehensive user data
ALTER TABLE "students"
ADD COLUMN "phone" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "gender" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "education" TEXT,
ADD COLUMN "institution" TEXT,
ADD COLUMN "occupation" TEXT,
ADD COLUMN "company" TEXT,
ADD COLUMN "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "bio" TEXT,
ADD COLUMN "linkedIn" TEXT;