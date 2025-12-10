-- Migration: Add task_collaborators table for multiple collaborators per task
-- Run this in Supabase SQL Editor

-- Create the task_collaborators junction table
CREATE TABLE IF NOT EXISTS task_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique task-user combinations
    UNIQUE(task_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_collaborators_task_id ON task_collaborators(task_id);
CREATE INDEX IF NOT EXISTS idx_task_collaborators_user_id ON task_collaborators(user_id);

-- Enable Row Level Security
ALTER TABLE task_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to view collaborators for tasks they have access to
CREATE POLICY "Users can view task collaborators"
ON task_collaborators FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN team_members tm ON tm.team_id = (
            SELECT team_id FROM teams WHERE board_id = t.board_id LIMIT 1
        )
        WHERE t.id = task_collaborators.task_id
        AND tm.user_id = auth.uid()
    )
);

-- Allow team members to add/remove collaborators
CREATE POLICY "Team members can manage collaborators"
ON task_collaborators FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN team_members tm ON tm.team_id = (
            SELECT team_id FROM teams WHERE board_id = t.board_id LIMIT 1
        )
        WHERE t.id = task_collaborators.task_id
        AND tm.user_id = auth.uid()
    )
);

-- Add notification preferences for collaborator notifications
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS email_collaborator_added BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_collaborator_removed BOOLEAN DEFAULT true;
