-- Add tutorId field to courses table
ALTER TABLE "courses" ADD COLUMN "tutorId" TEXT;

-- Add foreign key constraint for tutorId
ALTER TABLE "courses" ADD CONSTRAINT "courses_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "admins"("id") ON DELETE SET NULL;