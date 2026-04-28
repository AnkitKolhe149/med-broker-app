-- Add nullable tokenInvalidBefore column for JWT invalidation timestamps.
-- This is safe for existing data because the column is nullable.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "tokenInvalidBefore" TIMESTAMPTZ;
