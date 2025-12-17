/**
 * Nokan Client SDK
 *
 * TypeScript SDK for integrating with Nokan Taskboard Public API.
 *
 * @packageDocumentation
 * @version 0.3.1
 *
 * @remarks
 * This SDK provides:
 * - Full TypeScript support with complete type definitions
 * - Standalone API client for any JavaScript/TypeScript project
 * - Ready-to-use React components (optional)
 * - Built-in error handling with typed errors
 * - Rate limiting support
 * - Dynamic priorities, columns, and statuses from API
 *
 * @example Basic usage
 * ```typescript
 * import { NokanClient } from 'nokan-client';
 *
 * const client = new NokanClient({
 *     token: 'nkn_live_xxx',
 *     baseUrl: 'https://your-app.vercel.app'
 * });
 *
 * // Connect and discover board info
 * const info = await client.connect();
 * console.log('Board:', info.boardTitle);
 * console.log('Permissions:', info.permissions);
 * console.log('Columns:', info.columns);
 * console.log('Priorities:', info.priorities);
 * console.log('Statuses:', info.statuses);
 *
 * // List tickets
 * const { data: tickets, meta } = await client.listTickets({ page: 1 });
 * console.log(`Found ${meta.pagination.total} tickets`);
 *
 * // Create a ticket (column_id is optional - defaults to first column)
 * const newTicket = await client.createTicket({
 *     title: 'Feature request',
 *     description: 'Add dark mode support',
 *     priority: 'High' // Use label from info.priorities
 * });
 *
 * // Add a comment
 * await client.addComment(newTicket.id, {
 *     content: 'This is important for accessibility!'
 * });
 * ```
 *
 * @example React components
 * ```tsx
 * import { NokanClient, TicketForm, TicketList, TicketView } from 'nokan-client';
 *
 * const client = new NokanClient({ token: 'nkn_live_xxx', baseUrl: '...' });
 *
 * // Form for creating tickets
 * <TicketForm client={client} onSuccess={(t) => console.log(t)} />
 *
 * // List of tickets with pagination
 * <TicketList client={client} onTicketClick={(id) => setSelected(id)} />
 *
 * // Ticket details with comments
 * <TicketView client={client} ticketId="xxx" onClose={() => setSelected(null)} />
 * ```
 */

// Main client class
export { NokanClient } from './client';

// Error classes
export {
    NokanError,
    AuthenticationError,
    PermissionError,
    RateLimitError,
    NotFoundError,
    ValidationError,
    TimeoutError,
    NetworkError,
} from './errors';

// Types
export type {
    NokanClientConfig,
    ApiTokenInfo,
    Board,
    Ticket,
    TicketDetail,
    Comment,
    Attachment,
    CreateTicketInput,
    UpdateTicketInput,
    CreateCommentInput,
    ListTicketsOptions,
    PaginatedResponse,
    ApiResponse,
} from './types';

// React Components (optional - requires React peer dependency)
export {
    TicketForm,
    TicketView,
    TicketList,
} from './components';

export type {
    TicketFormProps,
    TicketFormStyles,
    TicketViewProps,
    TicketListProps,
} from './components';
