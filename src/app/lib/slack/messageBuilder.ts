import type { SlackChangeType } from '@/app/types/slackTypes';

const CHANGE_COLORS: Record<SlackChangeType, string> = {
  comment: '#3b82f6',
  assigned: '#a855f7',
  unassigned: '#a855f7',
  status: '#00a68b',
  priority: '#f59e0b',
  due_date: '#06b6d4',
  start_date: '#06b6d4',
  end_date: '#06b6d4',
  recurrence: '#8b5cf6',
  attachment: '#64748b',
  task_created: '#10b981',
  description: '#6366f1',
  type_changed: '#f97316',
  subtask: '#14b8a6',
  bug_fields: '#ef4444',
};

const CHANGE_EMOJI: Record<SlackChangeType, string> = {
  comment: '💬',
  assigned: '👤',
  unassigned: '👤',
  status: '📋',
  priority: '🔥',
  due_date: '📅',
  start_date: '📅',
  end_date: '📅',
  recurrence: '🔄',
  attachment: '📎',
  task_created: '✨',
  description: '📝',
  type_changed: '🏷️',
  subtask: '📌',
  bug_fields: '🐛',
};

const CHANGE_LABELS: Record<SlackChangeType, string> = {
  comment: 'Comment added',
  assigned: 'Assignee added',
  unassigned: 'Assignee removed',
  status: 'Status changed',
  priority: 'Priority changed',
  due_date: 'Due date changed',
  start_date: 'Start date changed',
  end_date: 'End date changed',
  recurrence: 'Recurrence changed',
  attachment: 'Attachment added',
  task_created: 'Task created',
  description: 'Description updated',
  type_changed: 'Type changed',
  subtask: 'Subtask updated',
  bug_fields: 'Bug fields updated',
};

interface BuildMessageParams {
  taskTitle: string;
  taskUrl: string;
  changeType: SlackChangeType;
  changedBy: string;
  boardName: string;
  details?: string;
}

export function buildSlackMessage({ taskTitle, taskUrl, changeType, changedBy, boardName, details }: BuildMessageParams) {
  const emoji = CHANGE_EMOJI[changeType] || '📋';
  const label = CHANGE_LABELS[changeType] || changeType;
  const color = CHANGE_COLORS[changeType] || '#64748b';

  const blocks: Record<string, unknown>[] = [];

  // Header: "Action label by Author"
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${label}* by ${changedBy}`,
    },
  });

  // Task link + details
  if (changeType === 'comment' && details) {
    // Comment: emoji + link, then quoted content
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} ${changedBy}'s Comment on *<${taskUrl}|${taskTitle}>*\n\n${details}`,
      },
    });
  } else if (details) {
    // Other changes with details
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} ${details} on *<${taskUrl}|${taskTitle}>*`,
      },
    });
  } else {
    // No details — just task link
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *<${taskUrl}|${taskTitle}>*`,
      },
    });
  }

  // Context: board name
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `in *${boardName}*`,
      },
    ],
  });

  // Action button
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: changeType === 'comment' ? 'View comment' : 'View task',
        },
        url: taskUrl,
        style: 'primary',
      },
    ],
  });

  return {
    blocks,
    attachments: [{ color }],
  };
}
