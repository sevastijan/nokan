import type { SlackNotificationPayload } from '@/app/types/slackTypes';

/** Strip HTML tags and decode entities for Slack plain text */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function triggerSlackNotification(payload: SlackNotificationPayload): void {
  // Strip HTML from details if it contains tags
  const cleanPayload = {
    ...payload,
    details: payload.details && /<[a-z][\s\S]*>/i.test(payload.details)
      ? stripHtml(payload.details)
      : payload.details,
  };

  fetch('/api/slack/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload),
  }).catch(() => {});
}
