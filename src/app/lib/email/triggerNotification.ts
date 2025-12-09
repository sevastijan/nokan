import type { EmailNotificationType } from '@/app/types/emailTypes';

export interface EmailNotificationPayload {
     type: EmailNotificationType;
     taskId: string;
     taskTitle: string;
     boardId: string;
     boardName?: string;
     recipientId: string;
     metadata?: Record<string, string>;
}

/**
 * Sends an email notification via the API endpoint.
 * Fire-and-forget - does not block on response.
 */
export async function triggerEmailNotification(payload: EmailNotificationPayload): Promise<void> {
     try {
          await fetch('/api/notifications/email', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(payload),
          });
     } catch {
          // Silently fail - email notifications shouldn't block the main flow
     }
}

/**
 * Sends email notification to multiple recipients (assignee and/or creator).
 * Filters out:
 * - Null recipients
 * - Current user (don't notify yourself)
 * - Duplicate recipients
 */
export function notifyTaskStakeholders(
     params: {
          type: EmailNotificationType;
          taskId: string;
          taskTitle: string;
          boardId: string;
          boardName?: string;
          metadata?: Record<string, string>;
     },
     recipients: {
          assigneeId?: string | null;
          creatorId?: string | null;
          currentUserId?: string;
     }
): void {
     const { assigneeId, creatorId, currentUserId } = recipients;
     const notified = new Set<string>();

     // Notify assignee
     if (assigneeId && assigneeId !== currentUserId) {
          notified.add(assigneeId);
          triggerEmailNotification({
               ...params,
               recipientId: assigneeId,
          });
     }

     // Notify creator (if different from assignee and current user)
     if (creatorId && creatorId !== currentUserId && !notified.has(creatorId)) {
          triggerEmailNotification({
               ...params,
               recipientId: creatorId,
          });
     }
}
