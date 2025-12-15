-- Migration: Add Task Types (Task / Story with Subtasks)
-- Run this migration in Supabase SQL Editor

-- 1. Add type column (default: 'task')
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'task';

-- 2. Add parent_id for subtasks (self-referencing)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS parent_id UUID;

-- 3. Add constraint: type must be 'task' or 'story'
ALTER TABLE tasks
ADD CONSTRAINT tasks_type_check CHECK (type IN ('task', 'story'));

-- 4. Add foreign key for parent_id (subtasks belong to a story)
ALTER TABLE tasks
ADD CONSTRAINT tasks_parent_fk
FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- 5. Constraint: story cannot be a subtask (story cannot have parent_id)
ALTER TABLE tasks
ADD CONSTRAINT story_no_parent
CHECK (NOT (type = 'story' AND parent_id IS NOT NULL));

-- 6. Constraint: only task can be a subtask
ALTER TABLE tasks
ADD CONSTRAINT only_task_as_subtask
CHECK (parent_id IS NULL OR type = 'task');

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);

-- 8. Update RLS policies (subtasks inherit board_id from parent)
-- No changes needed - subtasks have their own board_id which is validated by existing policies

-- 9. Constraint: Story cannot be recurring
ALTER TABLE tasks
ADD CONSTRAINT story_no_recurring
CHECK (NOT (type = 'story' AND is_recurring = true));
