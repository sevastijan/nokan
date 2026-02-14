-- Add bug-specific fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bug_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bug_scenario TEXT;

-- Update type constraint to include 'bug'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type IN ('task', 'story', 'bug'));
