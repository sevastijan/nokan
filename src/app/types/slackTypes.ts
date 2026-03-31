export interface SlackIntegration {
  id: string;
  board_id: string;
  channel_id: string;
  channel_name?: string | null;
  workspace_name?: string | null;
  team_id?: string | null;
  access_token: string;
  created_by?: string | null;
  active: boolean;
  created_at?: string;
}

export type SlackChangeType =
  | 'comment'
  | 'assigned'
  | 'unassigned'
  | 'status'
  | 'description'
  | 'priority'
  | 'due_date'
  | 'start_date'
  | 'end_date'
  | 'recurrence'
  | 'attachment'
  | 'task_created'
  | 'type_changed'
  | 'subtask'
  | 'bug_fields';

export interface SlackNotificationPayload {
  boardId: string;
  taskId: string;
  taskTitle: string;
  changeType: SlackChangeType;
  changedBy: string;
  details?: string;
}
