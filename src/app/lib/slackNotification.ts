import type { SlackNotificationPayload } from '@/app/types/slackTypes';

export function triggerSlackNotification(payload: SlackNotificationPayload): void {
  fetch('/api/slack/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
