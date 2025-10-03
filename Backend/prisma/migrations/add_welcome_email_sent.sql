-- Add welcomeEmailSent field to admins table
ALTER TABLE admins ADD COLUMN "welcomeEmailSent" BOOLEAN NOT NULL DEFAULT false;

-- Change default value of isActive to false for new tutors
ALTER TABLE admins ALTER COLUMN "isActive" SET DEFAULT false;
