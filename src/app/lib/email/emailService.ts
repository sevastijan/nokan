import { Resend } from 'resend';
import {
     taskAssignedTemplate,
     taskUnassignedTemplate,
     taskStatusChangedTemplate,
     taskPriorityChangedTemplate,
     taskCommentedTemplate,
     taskDueDateChangedTemplate,
} from './templates';
import type { EmailNotificationPayload } from '@/app/types/emailTypes';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getTaskUrl(boardId: string, taskId: string): string {
     return `${APP_URL}/board/${boardId}?task=${taskId}`;
}

function getEmailSubject(type: EmailNotificationPayload['type'], taskTitle: string): string {
     switch (type) {
          case 'task_assigned':
               return `Przypisano Ci zadanie: ${taskTitle}`;
          case 'task_unassigned':
               return `Usunięto Cię z zadania: ${taskTitle}`;
          case 'status_changed':
               return `Zmiana statusu: ${taskTitle}`;
          case 'priority_changed':
               return `Zmiana priorytetu: ${taskTitle}`;
          case 'new_comment':
               return `Nowy komentarz: ${taskTitle}`;
          case 'due_date_changed':
               return `Zmiana terminu: ${taskTitle}`;
          default:
               return `Powiadomienie: ${taskTitle}`;
     }
}

function getEmailHtml(payload: EmailNotificationPayload): string {
     const taskUrl = getTaskUrl(payload.boardId, payload.taskId);
     const boardName = payload.boardName || 'Tablica';

     switch (payload.type) {
          case 'task_assigned':
               return taskAssignedTemplate(
                    payload.taskTitle,
                    boardName,
                    taskUrl,
                    payload.metadata?.assignerName
               );

          case 'task_unassigned':
               return taskUnassignedTemplate(
                    payload.taskTitle,
                    boardName,
                    taskUrl,
                    payload.metadata?.unassignerName
               );

          case 'status_changed':
               return taskStatusChangedTemplate(
                    payload.taskTitle,
                    payload.metadata?.oldStatus || 'Nieznany',
                    payload.metadata?.newStatus || 'Nieznany',
                    taskUrl
               );

          case 'priority_changed':
               return taskPriorityChangedTemplate(
                    payload.taskTitle,
                    payload.metadata?.oldPriority || 'Nieznany',
                    payload.metadata?.newPriority || 'Nieznany',
                    taskUrl
               );

          case 'new_comment':
               return taskCommentedTemplate(
                    payload.taskTitle,
                    payload.metadata?.commenterName || 'Użytkownik',
                    payload.metadata?.commentPreview || '',
                    taskUrl
               );

          case 'due_date_changed':
               return taskDueDateChangedTemplate(
                    payload.taskTitle,
                    payload.metadata?.newDueDate || 'Nieznany',
                    taskUrl
               );

          default:
               return '';
     }
}

export async function sendEmailNotification(
     payload: EmailNotificationPayload
): Promise<{ success: boolean; error?: string }> {
     try {
          const subject = getEmailSubject(payload.type, payload.taskTitle);
          const html = getEmailHtml(payload);

          if (!html) {
               return { success: false, error: 'Unknown notification type' };
          }

          const { error } = await resend.emails.send({
               from: EMAIL_FROM,
               to: payload.recipientEmail,
               subject,
               html,
          });

          if (error) {
               console.error('Email send error:', error.message);
               return { success: false, error: error.message };
          }

          return { success: true };
     } catch (error) {
          console.error('Email service error:', error instanceof Error ? error.message : 'Unknown error');
          return {
               success: false,
               error: error instanceof Error ? error.message : 'Unknown error',
          };
     }
}
