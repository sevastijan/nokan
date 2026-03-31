import type { SlackNotificationPayload } from '@/app/types/slackTypes';

/** Strip HTML tags, decode entities, extract mention names for Slack plain text */
export function stripHtml(html: string): string {
  return html
    // Convert @{Name} mention format to @Name
    .replace(/@\{([^}]+)\}/g, '@$1')
    // Convert <span data-mention="Name">...</span> to @Name
    .replace(/<span[^>]*data-mention="([^"]*)"[^>]*>.*?<\/span>/gi, '@$1')
    // Newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    // Strip all remaining HTML tags (including unclosed/truncated ones)
    .replace(/<[^>]*>?/g, '')
    // Decode entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function triggerSlackNotification(payload: SlackNotificationPayload): void {
  const cleanPayload = {
    ...payload,
    // Always strip HTML from details — content may contain rich text from Lexical editor
    details: payload.details ? stripHtml(payload.details) : payload.details,
  };

  fetch('/api/slack/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload),
  }).catch(() => {});
}
