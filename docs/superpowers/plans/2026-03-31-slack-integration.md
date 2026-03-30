# Slack Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect boards to Slack channels via OAuth, sending rich Block Kit notifications for all task changes.

**Architecture:** Slack App credentials stored in `app_settings` DB table. Per-board OAuth tokens in `slack_integrations`. Fire-and-forget `triggerSlackNotification()` called from existing task mutations. API routes handle OAuth flow and message sending.

**Tech Stack:** Next.js API routes, Supabase, Slack Web API (chat.postMessage, oauth.v2.access), Block Kit, RTK Query.

**Spec:** `docs/superpowers/specs/2026-03-31-slack-integration-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/014_add_slack_integration.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Global app settings (key-value)
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Per-board Slack integration
CREATE TABLE IF NOT EXISTS slack_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL UNIQUE REFERENCES boards(id) ON DELETE CASCADE,
  channel_id text NOT NULL,
  channel_name text,
  workspace_name text,
  team_id text,
  access_token text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slack_integrations_board ON slack_integrations(board_id);
```

- [ ] **Step 2: Run migration in Supabase**

Execute SQL via the pg/query API endpoint.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/014_add_slack_integration.sql
git commit -m "feat(slack): add database tables for app_settings and slack_integrations"
```

---

### Task 2: Types and Slack Notification Utility

**Files:**
- Create: `src/app/types/slackTypes.ts`
- Create: `src/app/lib/slackNotification.ts`

- [ ] **Step 1: Create types**

```typescript
// src/app/types/slackTypes.ts

export interface SlackIntegration {
  id: string;
  board_id: string;
  channel_id: string;
  channel_name?: string | null;
  workspace_name?: string | null;
  team_id?: string | null;
  access_token: string;
  created_by?: string | null;
  active: boolean;
  created_at?: string;
}

export type SlackChangeType =
  | 'comment'
  | 'assigned'
  | 'unassigned'
  | 'status'
  | 'description'
  | 'priority'
  | 'due_date'
  | 'start_date'
  | 'end_date'
  | 'recurrence'
  | 'attachment'
  | 'task_created';

export interface SlackNotificationPayload {
  boardId: string;
  taskId: string;
  taskTitle: string;
  changeType: SlackChangeType;
  changedBy: string;
  details?: string;
}
```

- [ ] **Step 2: Create fire-and-forget utility**

```typescript
// src/app/lib/slackNotification.ts

import type { SlackNotificationPayload } from '@/app/types/slackTypes';

/**
 * Fire-and-forget Slack notification.
 * Called from RTK Query mutations and comment handlers.
 */
export function triggerSlackNotification(payload: SlackNotificationPayload): void {
  fetch('/api/slack/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silent failure — Slack notifications are best-effort
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/types/slackTypes.ts src/app/lib/slackNotification.ts
git commit -m "feat(slack): add types and fire-and-forget notification utility"
```

---

### Task 3: Slack Message Builder

**Files:**
- Create: `src/app/lib/slack/messageBuilder.ts`

- [ ] **Step 1: Create Block Kit message builder**

```typescript
// src/app/lib/slack/messageBuilder.ts

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
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: mainText,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/lib/slack/messageBuilder.ts
git commit -m "feat(slack): add Block Kit message builder"
```

---

### Task 4: Slack API Routes — OAuth Install & Callback

**Files:**
- Create: `src/app/api/slack/install/route.ts`
- Create: `src/app/api/slack/callback/route.ts`

- [ ] **Step 1: Create install route**

`GET /api/slack/install?boardId=X` — reads Slack credentials from `app_settings`, generates OAuth URL, redirects to Slack.

Must:
- Validate session (OWNER only via `getServerSession`)
- Check user role from DB
- Read `slack_client_id` from `app_settings` table
- Build OAuth URL: `https://slack.com/oauth/v2/authorize?client_id={id}&scope=chat:write,channels:read,groups:read&redirect_uri={APP_URL}/api/slack/callback&state={boardId}`
- State should encode `boardId` as base64
- Redirect (302) to Slack

- [ ] **Step 2: Create callback route**

`GET /api/slack/callback?code=X&state=X` — exchanges code for token, saves integration.

Must:
- Decode `boardId` from state
- Read `slack_client_id` + `slack_client_secret` from `app_settings`
- POST to `https://slack.com/api/oauth.v2.access` with code, client_id, client_secret, redirect_uri
- Extract from response: `access_token`, `team.name`, `team.id`, `incoming_webhook.channel_id`, `incoming_webhook.channel`
- If response has `authed_user` but no incoming_webhook, use `bot_user_id` flow — the token is in `access_token` at top level
- Upsert into `slack_integrations` (board_id, channel_id, channel_name, workspace_name, team_id, access_token, created_by, active=true)
- Redirect to `/board/{boardId}?slack=connected`

Use `createClient` with service role key for DB operations (not user's supabase client).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/slack/install/route.ts src/app/api/slack/callback/route.ts
git commit -m "feat(slack): add OAuth install and callback routes"
```

---

### Task 5: Slack API Route — Send Message

**Files:**
- Create: `src/app/api/slack/send/route.ts`

- [ ] **Step 1: Create send route**

`POST /api/slack/send` — internal endpoint, sends Block Kit message to Slack.

Must:
- Validate session via `getToken` (same pattern as `/api/push/send`)
- Read body: `{ boardId, taskId, taskTitle, changeType, changedBy, details }`
- Query `slack_integrations` where `board_id = boardId` AND `active = true`
- If no integration → return `{ success: true, skipped: true }`
- Query board title from `boards` table
- Build task URL: `https://nokan.nkdlab.space/board/{boardId}?task={taskId}`
- Call `buildSlackMessage()` from `src/app/lib/slack/messageBuilder.ts`
- POST to `https://slack.com/api/chat.postMessage` with:
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
  - Body: `{ channel: channel_id, ...message }`
- On 401 or `token_revoked` error → set `active = false` on the integration
- Return `{ success: true }`

- [ ] **Step 2: Commit**

```bash
git add src/app/api/slack/send/route.ts
git commit -m "feat(slack): add send message API route"
```

---

### Task 6: Slack API Route — Disconnect

**Files:**
- Create: `src/app/api/slack/disconnect/route.ts`

- [ ] **Step 1: Create disconnect route**

`DELETE /api/slack/disconnect?boardId=X` — removes integration.

Must:
- Validate session (OWNER only)
- Delete from `slack_integrations` where `board_id = boardId`
- Return `{ success: true }`

- [ ] **Step 2: Commit**

```bash
git add src/app/api/slack/disconnect/route.ts
git commit -m "feat(slack): add disconnect route"
```

---

### Task 7: RTK Query Endpoints

**Files:**
- Create: `src/app/store/endpoints/slackEndpoints.ts`
- Modify: `src/app/store/apiSlice.ts`

- [ ] **Step 1: Create slackEndpoints.ts**

Endpoints:
- `getAppSettings` — query(void), returns Record<string, string> from `app_settings`
- `saveAppSetting` — mutation({ key, value }), upserts to `app_settings`
- `getSlackIntegration` — query(boardId: string), returns SlackIntegration | null from `slack_integrations`
- `disconnectSlack` — mutation(boardId: string), calls `DELETE /api/slack/disconnect?boardId=X`

Tag types: `AppSettings`, `SlackIntegration`

Follow exact same pattern as `crmEndpoints.ts` — `getSupabase()`, `{ data }` / `{ error: { status: 'CUSTOM_ERROR', error: message } }`.

For `getSlackIntegration`, handle `PGRST116` error (no row) gracefully — return `null`.

- [ ] **Step 2: Register in apiSlice.ts**

- Import `slackEndpoints`
- Add tag types: `'AppSettings'`, `'SlackIntegration'`
- Spread in endpoints: `...slackEndpoints(builder)`
- Export hooks: `useGetAppSettingsQuery`, `useSaveAppSettingMutation`, `useGetSlackIntegrationQuery`, `useDisconnectSlackMutation`

- [ ] **Step 3: Commit**

```bash
git add src/app/store/endpoints/slackEndpoints.ts src/app/store/apiSlice.ts
git commit -m "feat(slack): add RTK Query endpoints for app settings and Slack integration"
```

---

### Task 8: i18n Translations

**Files:**
- Modify: `src/app/i18n/locales/pl.json`
- Modify: `src/app/i18n/locales/en.json`

- [ ] **Step 1: Add Slack i18n keys to both locales**

Polish (`pl.json`), add `"slack"` section:
```json
"slack": {
  "title": "Slack",
  "appSettings": "Ustawienia Slack App",
  "clientId": "Client ID",
  "clientSecret": "Client Secret",
  "signingSecret": "Signing Secret",
  "saveCredentials": "Zapisz",
  "credentialsSaved": "Credentials zapisane",
  "notConfigured": "Slack App nie skonfigurowany",
  "configureFirst": "Skonfiguruj Slack App w ustawieniach",
  "connect": "Połącz ze Slack",
  "disconnect": "Odłącz",
  "disconnected": "Slack odłączony",
  "connected": "Połączono ze Slack",
  "connectedTo": "Połączono z",
  "channel": "Kanał",
  "workspace": "Workspace",
  "active": "Aktywny",
  "inactive": "Nieaktywny"
}
```

English equivalents in `en.json`.

- [ ] **Step 2: Commit**

```bash
git add src/app/i18n/locales/pl.json src/app/i18n/locales/en.json
git commit -m "feat(slack): add i18n translations"
```

---

### Task 9: App Settings UI (Slack Credentials)

**Files:**
- Create: `src/app/components/Settings/SlackAppSettings.tsx`
- Modify: `src/app/components/Navbar.tsx` (add Settings link for OWNER)
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Create SlackAppSettings component**

A card with 3 input fields (Client ID, Client Secret, Signing Secret) and Save button. Uses `useGetAppSettingsQuery` to load current values, `useSaveAppSettingMutation` to save each. Shows toast on success. Password-type inputs for secrets. Only visible to OWNER.

- [ ] **Step 2: Create settings page**

`src/app/settings/page.tsx` — simple page that checks OWNER role (redirect otherwise), renders `SlackAppSettings`. Styled like CRM pages (dark theme, px-4 py-6).

- [ ] **Step 3: Add Settings link in Navbar**

In the OWNER section of the nav array (near CRM), add:
```typescript
{ href: '/settings', label: t('nav.settings') || 'Ustawienia', icon: Settings }
```
Import `Settings` from `lucide-react`.

Also add `"settings"` key to i18n nav section.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/Settings/SlackAppSettings.tsx src/app/settings/page.tsx src/app/components/Navbar.tsx src/app/i18n/locales/pl.json src/app/i18n/locales/en.json
git commit -m "feat(slack): add app settings page with Slack credentials management"
```

---

### Task 10: Board Slack Settings UI

**Files:**
- Create: `src/app/components/Board/SlackSection.tsx`
- Modify: `src/app/components/Board/BoardHeader.tsx` (add Slack section to board settings)

- [ ] **Step 1: Create SlackSection component**

Props: `boardId: string`

Three states:
1. **Slack App not configured** — reads `useGetAppSettingsQuery()`, checks for `slack_client_id`. Shows message "Skonfiguruj Slack App w ustawieniach" with link.
2. **Not connected** — "Połącz ze Slack" button. On click → `window.location.href = /api/slack/install?boardId=${boardId}`.
3. **Connected** — Shows channel name, workspace name, active status badge, "Odłącz" button (calls `useDisconnectSlackMutation`).

Uses `useGetSlackIntegrationQuery(boardId)`.
Only rendered when user is OWNER.

- [ ] **Step 2: Add SlackSection to BoardHeader**

In the board settings dropdown/modal in `BoardHeader.tsx`, add `<SlackSection boardId={boardId} />` after existing settings. Import it. Only show when `userRole === 'OWNER'`.

Read `BoardHeader.tsx` first to find where settings are rendered and follow the existing pattern.

- [ ] **Step 3: Handle `?slack=connected` query param**

In the board page or BoardHeader, detect `?slack=connected` in URL and show a success toast. Use `useSearchParams()`.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/Board/SlackSection.tsx src/app/components/Board/BoardHeader.tsx
git commit -m "feat(slack): add Slack connection UI in board settings"
```

---

### Task 11: Wire Up Slack Notifications to Task Mutations

**Files:**
- Modify: `src/app/store/endpoints/taskEndpoints.ts`

- [ ] **Step 1: Import triggerSlackNotification**

At top of file:
```typescript
import { triggerSlackNotification } from '@/app/lib/slackNotification';
```

- [ ] **Step 2: Add Slack notification to updateTask mutation**

After the snapshot creation block (around line 744, after `changed_fields` check), add:

```typescript
// Trigger Slack notification for each changed field
if (changedFields.length > 0) {
  const boardId = updated.board_id;
  const slackChangeMap: Record<string, string> = {
    column_id: 'status',
    user_id: 'assigned',
    priority: 'priority',
    description: 'description',
    due_date: 'due_date',
    start_date: 'start_date',
    end_date: 'end_date',
    is_recurring: 'recurrence',
    recurrence_type: 'recurrence',
  };

  for (const field of changedFields) {
    const changeType = slackChangeMap[field];
    if (changeType && boardId) {
      let details: string | undefined;
      if (field === 'column_id') {
        // Need column names — can be derived from before/after
        const oldVal = beforeSnapshot[field];
        const newVal = afterSnapshot[field];
        details = `zmienił(a) status`;
      } else if (field === 'priority') {
        details = `zmienił(a) priorytet`;
      } else if (field === 'due_date') {
        details = updated.due_date ? `ustawił(a) termin: ${updated.due_date}` : 'usunął/ęła termin';
      } else if (field === 'start_date') {
        details = updated.start_date ? `ustawił(a) datę rozpoczęcia: ${updated.start_date}` : 'usunął/ęła datę rozpoczęcia';
      } else if (field === 'end_date') {
        details = updated.end_date ? `ustawił(a) datę zakończenia: ${updated.end_date}` : 'usunął/ęła datę zakończenia';
      } else if (field === 'description') {
        details = 'zaktualizował(a) opis';
      } else if (field === 'is_recurring' || field === 'recurrence_type') {
        details = updated.is_recurring ? `ustawił(a) cykliczność: ${updated.recurrence_type}` : 'wyłączył(a) cykliczność';
      }

      triggerSlackNotification({
        boardId,
        taskId,
        taskTitle: updated.title,
        changeType: changeType as any,
        changedBy: userId || 'Ktoś',
        details,
      });
      break; // One Slack message per save, not per field
    }
  }
}
```

Note: `changedBy` here is `userId` (a UUID). The `/api/slack/send` route should resolve the user's name from DB before building the message. Update the send route to accept userId and look up the name.

- [ ] **Step 3: Add Slack notification to uploadAttachment mutation**

After the snapshot insert (around line 878):
```typescript
triggerSlackNotification({
  boardId: /* need to get board_id — fetch from task */,
  taskId,
  taskTitle: attachment.file_name,
  changeType: 'attachment',
  changedBy: userId || 'Ktoś',
  details: `dodał(a) załącznik: ${attachment.file_name}`,
});
```

Since `uploadAttachment` doesn't have `boardId`, fetch it from the task first or add `boardId` to the mutation params.

- [ ] **Step 4: Add Slack notification to addTask mutation**

In the `addTask` mutation, after successful insert:
```typescript
if (result.board_id) {
  triggerSlackNotification({
    boardId: result.board_id,
    taskId: result.id,
    taskTitle: result.title,
    changeType: 'task_created',
    changedBy: data.created_by || 'Ktoś',
    details: `utworzył(a) zadanie`,
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/store/endpoints/taskEndpoints.ts
git commit -m "feat(slack): wire up notifications to task mutations"
```

---

### Task 12: Wire Up Slack Notifications to Comments

**Files:**
- Modify: `src/app/components/SingleTaskView/ActivityFeed.tsx`
- Modify: `src/app/components/SingleTaskView/CommentsSection.tsx`

- [ ] **Step 1: Add Slack notification to ActivityFeed addComment**

Import `triggerSlackNotification` from `@/app/lib/slackNotification`. After successful comment insert, add:

```typescript
triggerSlackNotification({
  boardId,
  taskId,
  taskTitle: taskTitle || 'zadanie',
  changeType: 'comment',
  changedBy: currentUser.id,
  details: content.substring(0, 100),
});
```

- [ ] **Step 2: Same for CommentsSection addComment**

Same pattern — import and call `triggerSlackNotification` after successful comment insert.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/SingleTaskView/ActivityFeed.tsx src/app/components/SingleTaskView/CommentsSection.tsx
git commit -m "feat(slack): send notifications on new comments"
```

---

### Task 13: Update /api/slack/send to Resolve User Names

**Files:**
- Modify: `src/app/api/slack/send/route.ts`

- [ ] **Step 1: Resolve changedBy UUID to display name**

In the send route, after reading the request body, look up the user:

```typescript
let displayName = body.changedBy;
if (body.changedBy && body.changedBy.length > 10) {
  // Looks like a UUID, resolve to name
  const { data: user } = await supabase
    .from('users')
    .select('name, custom_name')
    .eq('id', body.changedBy)
    .single();
  if (user) {
    displayName = user.custom_name || user.name || 'Ktoś';
  }
}
```

Pass `displayName` to `buildSlackMessage` as `changedBy`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/slack/send/route.ts
git commit -m "feat(slack): resolve user UUID to display name in messages"
```

---

### Task 14: Final Integration & TypeScript Check

**Files:**
- Various

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Test OAuth flow manually**

1. Go to `/settings` → enter Slack App credentials
2. Go to board settings → click "Połącz ze Slack"
3. Authorize in Slack → verify redirect back with success
4. Make a task change → verify message in Slack channel

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat(slack): final integration fixes and polish"
```
