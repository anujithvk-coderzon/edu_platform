-- Script to fix the UserRole enum issue
-- Run this in your PostgreSQL database

-- Step 1: Drop all constraints and dependencies
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Update all existing users to ADMIN
UPDATE users SET role = 'ADMIN' WHERE role IS NOT NULL;

-- Step 3: Drop and recreate the UserRole enum
DROP TYPE IF EXISTS "UserRole" CASCADE;
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- Step 4: Update the column to use the new enum and set proper default
ALTER TABLE users ALTER COLUMN role TYPE "UserRole" USING 'ADMIN'::"UserRole";
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'ADMIN'::"UserRole";

-- Step 5: Verify the changes
SELECT column_name, column_default, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';