-- Manual migration script to unify User model and add role support

-- Step 1: Create new users table from existing admins and students
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "avatar" TEXT,
  "role" TEXT NOT NULL DEFAULT 'TUTOR',
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Step 2: Migrate existing admin data to users table with ADMIN role
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "avatar", "role", "isVerified", "isActive", "createdAt", "updatedAt")
SELECT "id", "email", "password", "firstName", "lastName", "avatar", 'ADMIN', "isVerified", "isActive", "createdAt", "updatedAt"
FROM "admins"
ON CONFLICT ("id") DO NOTHING;

-- Step 3: Migrate existing student data to users table with STUDENT role
INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "avatar", "role", "isVerified", "isActive", "createdAt", "updatedAt")
SELECT "id", "email", "password", "firstName", "lastName", "avatar", 'STUDENT', "isVerified", "isActive", "createdAt", "updatedAt"
FROM "students"
ON CONFLICT ("id") DO NOTHING;

-- Step 4: Add tutorId column to courses table
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tutorId" TEXT;

-- Step 5: Add foreign key constraint for tutorId
ALTER TABLE "courses" ADD CONSTRAINT "courses_tutorId_fkey"
FOREIGN KEY ("tutorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Update all foreign key references from admins/students to users
-- Update course creator references
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_creatorId_fkey";
ALTER TABLE "courses" ADD CONSTRAINT "courses_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update materials author references
ALTER TABLE "materials" DROP CONSTRAINT IF EXISTS "materials_authorId_fkey";
ALTER TABLE "materials" ADD CONSTRAINT "materials_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update assignments creator references
ALTER TABLE "assignments" DROP CONSTRAINT IF EXISTS "assignments_creatorId_fkey";
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_creatorId_fkey"
FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update announcements author references
ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "announcements_authorId_fkey";
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update enrollments user references
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_userId_fkey";
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update assignment_submissions student references
ALTER TABLE "assignment_submissions" DROP CONSTRAINT IF EXISTS "assignment_submissions_studentId_fkey";
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update progress user references
ALTER TABLE "progress" DROP CONSTRAINT IF EXISTS "progress_userId_fkey";
ALTER TABLE "progress" ADD CONSTRAINT "progress_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update discussion_posts author references
ALTER TABLE "discussion_posts" DROP CONSTRAINT IF EXISTS "discussion_posts_authorId_fkey";
ALTER TABLE "discussion_posts" ADD CONSTRAINT "discussion_posts_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update quiz_attempts student references
ALTER TABLE "quiz_attempts" DROP CONSTRAINT IF EXISTS "quiz_attempts_studentId_fkey";
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update reviews user references
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_userId_fkey";
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note: The old admins and students tables should be dropped after verifying the migration
-- DROP TABLE IF EXISTS "admins";
-- DROP TABLE IF EXISTS "students";