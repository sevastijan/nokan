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
};

const CHANGE_LABELS: Record<SlackChangeType, string> = {
  comment: 'Komentarz',
  assigned: 'Przypisanie',
  unassigned: 'Usunięcie przypisania',
  status: 'Status',
  priority: 'Priorytet',
  due_date: 'Termin',
  start_date: 'Data rozpoczęcia',
  end_date: 'Data zakończenia',
  recurrence: 'Cykliczność',
  attachment: 'Załącznik',
  task_created: 'Nowe zadanie',
  description: 'Opis',
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
  const emoji = CHANGE_EMOJI[changeType];
  const label = CHANGE_LABELS[changeType];
  const color = CHANGE_COLORS[changeType];

  const mainText = details
    ? `*<${taskUrl}|${taskTitle}>*\n${changedBy} · ${details}`
    : `*<${taskUrl}|${taskTitle}>*\n${changedBy}`;

  const now = new Date().toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    blocks: [
      {
        type: 'section' as const,
        text: {
          type: 'mrkdwn' as const,
          text: mainText,
        },
      },
      {
        type: 'context' as const,
        elements: [
          {
            type: 'mrkdwn' as const,
            text: `${emoji} *${boardName}* · ${label} · ${now}`,
          },
        ],
      },
    ],
    attachments: [
      {
        color,
      },
    ],
  };
}
