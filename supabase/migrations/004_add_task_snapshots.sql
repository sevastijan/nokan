-- Task Snapshots: stores version history for tasks (JSONB snapshot-based approach)
CREATE TABLE task_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  snapshot JSONB NOT NULL,
  changed_fields TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, version)
);

CREATE INDEX idx_task_snapshots_task_id ON task_snapshots(task_id);
CREATE INDEX idx_task_snapshots_created_at ON task_snapshots(created_at DESC);
