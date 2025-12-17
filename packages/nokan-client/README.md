# nokan-client

[![npm version](https://badge.fury.io/js/nokan-client.svg)](https://www.npmjs.com/package/nokan-client)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK with React components for Nokan Taskboard Public API.

## Features

- Full TypeScript support with complete type definitions
- Standalone API client for any JavaScript/TypeScript project
- Ready-to-use React components (optional)
- Built-in error handling with typed errors
- Rate limiting support
- Works in Node.js and browser environments

## Installation

```bash
npm install nokan-client
```

## Quick Start

```typescript
import { NokanClient } from 'nokan-client';

const client = new NokanClient({
    token: 'nkn_live_xxx', // Get this from Board Settings > API
    baseUrl: 'https://your-app.vercel.app'
});

// Connect and discover board info
const info = await client.connect();
console.log('Connected to board:', info.boardTitle);
console.log('Permissions:', info.permissions);
console.log('Available columns:', info.columns);

// List tickets
const { data: tickets, meta } = await client.listTickets({ page: 1, limit: 20 });
console.log(`Found ${meta.pagination.total} tickets`);

// Create a ticket
const newTicket = await client.createTicket({
    title: 'Bug report',
    column_id: info.columns[0].id,
    description: 'Something is not working correctly',
    priority: 'high'
});

// Add a comment
await client.addComment(newTicket.id, {
    content: 'This needs immediate attention!'
});
```

## API Reference

### Constructor

```typescript
const client = new NokanClient({
    token: string,       // Required: API token from board settings
    baseUrl?: string,    // Optional: API base URL (default: current origin)
    timeout?: number     // Optional: Request timeout in ms (default: 30000)
});
```

### Methods

#### `connect(): Promise<ApiTokenInfo>`

Connect to the API and discover board information. **Must be called before using other methods.**

Returns:
- `boardId` - Board UUID
- `boardTitle` - Board name
- `permissions` - `{ read, write, delete }` booleans
- `columns` - Array of `{ id, title, order }`
- `statuses` - Array of `{ id, label, color }`

#### `getBoard(): Promise<Board>`

Get current board information. Requires `read` permission.

#### `listTickets(options?): Promise<PaginatedResponse<Ticket>>`

List tickets with pagination and filtering.

Options:
- `page` - Page number (default: 1)
- `limit` - Items per page, max 100 (default: 50)
- `column_id` - Filter by column
- `status_id` - Filter by status
- `completed` - Filter by completion status

#### `getTicket(ticketId): Promise<TicketDetail>`

Get ticket details including comments and attachments.

#### `createTicket(input): Promise<Ticket>`

Create a new ticket. Requires `write` permission.

Input:
- `title` - Required
- `column_id` - Required
- `description` - Optional
- `priority` - `'low' | 'medium' | 'high' | 'urgent'` (default: 'medium')
- `status_id` - Optional

#### `updateTicket(ticketId, input): Promise<Ticket>`

Update an existing ticket. Requires `write` permission.

#### `deleteTicket(ticketId): Promise<void>`

Delete a ticket. Requires `delete` permission.

#### `addComment(ticketId, input): Promise<Comment>`

Add a comment to a ticket. Requires `write` permission.

#### `listComments(ticketId): Promise<Comment[]>`

List comments for a ticket. Requires `read` permission.

#### `addAttachment(ticketId, file, fileName?): Promise<Attachment>`

Upload an attachment. Requires `write` permission. Max 10MB.

#### `listAttachments(ticketId): Promise<Attachment[]>`

List attachments for a ticket. Requires `read` permission.

### Error Handling

```typescript
import {
    NokanClient,
    AuthenticationError,
    PermissionError,
    RateLimitError,
    NotFoundError,
    ValidationError
} from 'nokan-client';

try {
    const ticket = await client.createTicket({ ... });
} catch (error) {
    if (error instanceof AuthenticationError) {
        // Token is invalid or expired
        console.error('Please check your API token');
    } else if (error instanceof PermissionError) {
        // Token doesn't have required permission
        console.error('Missing write permission');
    } else if (error instanceof RateLimitError) {
        // Too many requests
        console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
    } else if (error instanceof NotFoundError) {
        // Resource not found
        console.error('Ticket not found');
    } else if (error instanceof ValidationError) {
        // Invalid input
        console.error(`Validation error: ${error.message}`);
    }
}
```

## Permissions

When creating a token, you can set these permissions:

| Permission | Allows |
|------------|--------|
| `read` | GET endpoints (list, get details) |
| `write` | POST, PUT endpoints (create, update, comments, attachments) |
| `delete` | DELETE endpoints (delete tickets) |

## Rate Limiting

Default rate limit is 60 requests per minute per token. When exceeded, the API returns a 429 status with `Retry-After` header.

The SDK throws a `RateLimitError` with:
- `retryAfter` - Seconds until rate limit resets
- `resetAt` - Date when rate limit resets

## React Components

The SDK includes ready-to-use React components. React is an optional peer dependency.

### TicketForm

Form for creating new tickets.

```tsx
import { NokanClient, TicketForm } from 'nokan-client';

const client = new NokanClient({ token: 'nkn_live_xxx', baseUrl: '...' });

function App() {
    return (
        <TicketForm
            client={client}
            onSuccess={(ticket) => console.log('Created:', ticket.id)}
            onError={(error) => console.error(error)}
        />
    );
}
```

### TicketList

List of tickets with filtering and pagination.

```tsx
import { NokanClient, TicketList } from 'nokan-client';

const client = new NokanClient({ token: 'nkn_live_xxx', baseUrl: '...' });

function App() {
    return (
        <TicketList
            client={client}
            onTicketClick={(ticketId) => console.log('Selected:', ticketId)}
        />
    );
}
```

### TicketView

Ticket details with comments and attachments.

```tsx
import { NokanClient, TicketView } from 'nokan-client';

const client = new NokanClient({ token: 'nkn_live_xxx', baseUrl: '...' });

function App() {
    return (
        <TicketView
            client={client}
            ticketId="ticket-uuid-here"
            onClose={() => console.log('Closed')}
        />
    );
}
```

### Full Example

```tsx
import { useState } from 'react';
import { NokanClient, TicketForm, TicketList, TicketView } from 'nokan-client';

const client = new NokanClient({
    token: 'nkn_live_xxx',
    baseUrl: 'https://your-app.vercel.app'
});

function TicketSystem() {
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1 }}>
                <h2>New Ticket</h2>
                <TicketForm client={client} />

                <h2>Tickets</h2>
                <TicketList
                    client={client}
                    onTicketClick={setSelectedTicket}
                />
            </div>

            {selectedTicket && (
                <div style={{ flex: 1 }}>
                    <TicketView
                        client={client}
                        ticketId={selectedTicket}
                        onClose={() => setSelectedTicket(null)}
                    />
                </div>
            )}
        </div>
    );
}
```

## License

MIT
