-- Step 1: Add missing values to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';