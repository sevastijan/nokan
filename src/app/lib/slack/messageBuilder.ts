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
  comment: '\u{1F4AC}',
  assigned: '\u{1F464}',
  unassigned: '\u{1F464}',
  status: '\u{1F4CB}',
  priority: '\u{1F525}',
  due_date: '\u{1F4C5}',
  start_date: '\u{1F4C5}',
  end_date: '\u{1F4C5}',
  recurrence: '\u{1F504}',
  attachment: '\u{1F4CE}',
  task_created: '\u{2728}',
  description: '\u{1F4DD}',
  type_changed: '\u{1F3F7}\uFE0F',
  subtask: '\u{1F4CC}',
  bug_fields: '\u{1F41B}',
};

const CHANGE_LABELS: Record<SlackChangeType, string> = {
  comment: 'Komentarz',
  assigned: 'Przypisanie',
  unassigned: 'Usuni\u0119cie przypisania',
  status: 'Zmiana statusu',
  priority: 'Zmiana priorytetu',
  due_date: 'Termin',
  start_date: 'Data rozpocz\u0119cia',
  end_date: 'Data zako\u0144czenia',
  recurrence: 'Cykliczno\u015B\u0107',
  attachment: 'Za\u0142\u0105cznik',
  task_created: 'Nowe zadanie',
  description: 'Aktualizacja opisu',
  type_changed: 'Zmiana typu',
  subtask: 'Subtask',
  bug_fields: 'Pola b\u0142\u0119du',
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
  const emoji = CHANGE_EMOJI[changeType] || '\u{1F4CB}';
  const label = CHANGE_LABELS[changeType] || changeType;
  const color = CHANGE_COLORS[changeType] || '#64748b';

  const now = new Date().toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const blocks: Record<string, unknown>[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *<${taskUrl}|${taskTitle}>*`,
      },
    },
  ];

  // Details section
  if (details) {
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*${label}*\n${details}`,
        },
        {
          type: 'mrkdwn',
          text: `*Autor*\n${changedBy}`,
        },
      ],
    });
  } else {
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Akcja*\n${label}`,
        },
        {
          type: 'mrkdwn',
          text: `*Autor*\n${changedBy}`,
        },
      ],
    });
  }

  // Context
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `\u{1F4CB} *${boardName}* \u00B7 ${now}`,
      },
    ],
  });

  return {
    blocks,
    attachments: [{ color }],
  };
}
