# Slack Integration Design — Nokan Taskboard

**Date**: 2026-03-31
**Status**: Approved
**Scope**: Slack OAuth integration with per-board channel mapping and rich notifications

## Overview

Slack App (OAuth) integration allowing OWNER users to connect boards to Slack channels. Task changes on connected boards automatically send rich Block Kit messages to the assigned Slack channel.

## Key Decisions

- **Access**: OWNER only (configure Slack App credentials + connect boards)
- **Auth method**: Slack OAuth2 (not webhooks) — supports multiple workspaces
- **Mapping**: One board = one Slack channel (unique constraint on board_id)
- **Credentials storage**: Database (`app_settings` table), not env vars
- **Message format**: Slack Block Kit — colored card with task link, author, board badge
- **Delivery**: Fire-and-forget after task mutations

## Database Schema

### app_settings (global app config, key-value)

| Column | Type | Constraints |
|--------|------|-------------|
| key | text | PK |
| value | text | NOT NULL |
| updated_at | timestamptz | DEFAULT now() |

Keys for Slack: `slack_client_id`, `slack_client_secret`, `slack_signing_secret`

### slack_integrations (per-board Slack connection)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default gen_random_uuid() |
| board_id | uuid | FK → boards(id) ON DELETE CASCADE, UNIQUE |
| channel_id | text | NOT NULL |
| channel_name | text | |
| workspace_name | text | |
| team_id | text | Slack workspace ID |
| access_token | text | NOT NULL |
| created_by | uuid | FK → users(id) ON DELETE SET NULL |
| active | boolean | DEFAULT true |
| created_at | timestamptz | DEFAULT now() |

## API Routes

### GET /api/slack/install?boardId=X

1. Validate user session (must be OWNER)
2. Read `slack_client_id` from `app_settings`
3. Generate Slack OAuth URL with:
   - `client_id` from DB
   - `scope`: `chat:write`, `channels:read`, `groups:read`
   - `redirect_uri`: `{APP_URL}/api/slack/callback`
   - `state`: JSON with `boardId` + CSRF token
4. Redirect user to Slack authorization page

### GET /api/slack/callback

1. Slack redirects here after user authorizes
2. Exchange `code` for access token via `oauth.v2.access`
   - Read `slack_client_id` + `slack_client_secret` from `app_settings`
3. Extract: `access_token`, `team.name`, `incoming_webhook.channel_id`, `incoming_webhook.channel`
4. Upsert into `slack_integrations` with `board_id` from state
5. Redirect to board settings page with success toast

### POST /api/slack/send (internal)

1. Accepts: `boardId`, `taskTitle`, `taskId`, `changeType`, `changedBy`, `details`
2. Lookup `slack_integrations` where `board_id` = boardId AND `active` = true
3. If no integration → return silently
4. Build Block Kit message (see Message Format below)
5. POST to `https://slack.com/api/chat.postMessage` with token
6. On 401/token_revoked → set `active = false`
7. Fire-and-forget, no error propagation to user

### DELETE /api/slack/disconnect?boardId=X

1. Validate OWNER session
2. Delete from `slack_integrations` where `board_id` = boardId
3. Return success

## Events That Trigger Slack Messages

| Event | Change Type | Details |
|-------|-------------|---------|
| New comment | `comment` | Comment preview (first 100 chars) |
| Task assigned | `assigned` | Assignee name |
| Task unassigned | `unassigned` | Previous assignee name |
| Status changed (column) | `status` | Old → New column name |
| Description updated | `description` | — |
| Priority changed | `priority` | Old → New priority |
| Due date set/changed | `due_date` | New date |
| Start date set/changed | `start_date` | New date |
| End date set/changed | `end_date` | New date |
| Recurrence set | `recurrence` | Recurrence type + interval |
| Attachment added | `attachment` | File name |
| Task created | `task_created` | Column name |

## Message Format (Block Kit)

```json
{
  "channel": "C0123456789",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*<https://nokan.nkdlab.space/board/abc?task=xyz|Landing page redesign>*\nSebastian Ślęczka zmienił status → *W trakcie*"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "📋 *Cybersoul* · Status · 31 mar 2026, 14:23"
        }
      ]
    }
  ],
  "attachments": [
    {
      "color": "#00a68b"
    }
  ]
}
```

Color mapping:
- `comment` → #3b82f6 (blue)
- `assigned`/`unassigned` → #a855f7 (purple)
- `status` → #00a68b (brand green)
- `priority` → #f59e0b (amber)
- `due_date`/`start_date`/`end_date` → #06b6d4 (cyan)
- `recurrence` → #8b5cf6 (violet)
- `attachment` → #64748b (slate)
- `task_created` → #10b981 (emerald)
- `description` → #6366f1 (indigo)

## Integration Points in Existing Code

### triggerSlackNotification utility

New file: `src/app/lib/slackNotification.ts`

```typescript
export function triggerSlackNotification(params: {
  boardId: string;
  taskId: string;
  taskTitle: string;
  changeType: string;
  changedBy: string;
  details?: string;
}) {
  fetch('/api/slack/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(() => {});
}
```

Called from:
- `taskEndpoints.ts` → `updateTask` mutation (status, priority, dates, description, recurrence, assignment)
- `taskEndpoints.ts` → `uploadAttachment` mutation
- `taskEndpoints.ts` → `addTask` mutation
- `CommentsSection.tsx` / `ActivityFeed.tsx` → `addComment` function

## UI Components

### App Settings Page (new: /settings or modal)

Section "Slack App" visible to OWNER:
- Three input fields: Client ID, Client Secret, Signing Secret
- Save button → upserts to `app_settings`
- Status indicator: configured / not configured

### Board Settings — Slack Section

In board header dropdown or settings modal:
- If Slack App not configured → "Skonfiguruj Slack App w ustawieniach" link
- If not connected → "Połącz ze Slack" button (triggers OAuth flow)
- If connected → Shows channel name + workspace, "Odłącz" button, active toggle

Only visible to OWNER.

## RTK Query Endpoints

New endpoints in `boardEndpoints.ts` or new `slackEndpoints.ts`:

- `getAppSettings` — query, reads from `app_settings`
- `saveAppSetting` — mutation, upserts key/value
- `getSlackIntegration` — query(boardId), reads `slack_integrations`
- `disconnectSlack` — mutation(boardId), deletes integration

## Security

- Slack credentials stored in DB, read server-side only (API routes)
- Access tokens in `slack_integrations` — never exposed to client
- OAuth state parameter includes CSRF token to prevent forgery
- `/api/slack/send` validates request origin (not publicly callable — internal only, checks session or internal header)
- Token auto-deactivation on revocation

## Future Extensions (not in scope)

- Slack → Nokan: slash commands to create tasks from Slack
- Thread replies: Slack thread per task
- Interactive messages: buttons to change status from Slack
- Multiple channels per board
