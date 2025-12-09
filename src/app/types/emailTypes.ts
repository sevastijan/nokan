export type EmailNotificationType =
     | 'task_assigned'
     | 'task_unassigned'
     | 'status_changed'
     | 'priority_changed'
     | 'new_comment'
     | 'due_date_changed';

export interface EmailNotificationPayload {
     type: EmailNotificationType;
     taskId: string;
     taskTitle: string;
     boardId: string;
     boardName?: string;
     recipientId: string;
     recipientEmail: string;
     metadata?: {
          oldStatus?: string;
          newStatus?: string;
          oldPriority?: string;
          newPriority?: string;
          commenterName?: string;
          commentPreview?: string;
          newDueDate?: string;
          assignerName?: string;
          unassignerName?: string;
     };
}

export interface NotificationPreferences {
     id: string;
     user_id: string;
     email_task_assigned: boolean;
     email_task_unassigned: boolean;
     email_status_changed: boolean;
     email_priority_changed: boolean;
     email_new_comment: boolean;
     email_due_date_changed: boolean;
     created_at: string;
     updated_at: string;
}

export interface NotificationPreferencesInput {
     email_task_assigned?: boolean;
     email_task_unassigned?: boolean;
     email_status_changed?: boolean;
     email_priority_changed?: boolean;
     email_new_comment?: boolean;
     email_due_date_changed?: boolean;
}
