-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_url" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "resume_file_name" TEXT;
