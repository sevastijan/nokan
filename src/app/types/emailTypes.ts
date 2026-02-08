export type EmailNotificationType =
     | 'task_assigned'
     | 'task_unassigned'
     | 'status_changed'
     | 'priority_changed'
     | 'new_comment'
     | 'due_date_changed'
     | 'collaborator_added'
     | 'collaborator_removed'
     | 'mention'
     | 'new_submission';

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
          adderName?: string;
          removerName?: string;
          mentionerName?: string;
          clientName?: string;
          submissionDescription?: string;
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
     email_collaborator_added: boolean;
     email_collaborator_removed: boolean;
     email_mention: boolean;
     email_new_submission: boolean;
     push_enabled: boolean;
     push_chat_enabled: boolean;
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
     email_collaborator_added?: boolean;
     email_collaborator_removed?: boolean;
     email_mention?: boolean;
     email_new_submission?: boolean;
     push_enabled?: boolean;
     push_chat_enabled?: boolean;
}
