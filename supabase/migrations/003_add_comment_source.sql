-- Migration: Add source and author_email columns to task_comments for API comments
-- Run this migration in Supabase SQL Editor

-- 1. Add source column to identify comment origin
ALTER TABLE task_comments
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'user';

-- 2. Add author_email for API comments (when no user_id)
ALTER TABLE task_comments
ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);

-- 3. Add comments for documentation
COMMENT ON COLUMN task_comments.source IS 'Source of the comment: user (default), api, system';
COMMENT ON COLUMN task_comments.author_email IS 'Email of the author for API comments (when user_id is null)';

-- 4. Make user_id nullable for API comments
ALTER TABLE task_comments
ALTER COLUMN user_id DROP NOT NULL;
