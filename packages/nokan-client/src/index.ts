/**
 * Nokan Client SDK
 *
 * TypeScript SDK for integrating with Nokan Taskboard Public API.
 *
 * @packageDocumentation
 * @example
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
 *
 * // List tickets
 * const { data: tickets, meta } = await client.listTickets({ page: 1 });
 * console.log(`Found ${meta.pagination.total} tickets`);
 *
 * // Create a ticket
 * const newTicket = await client.createTicket({
 *     title: 'Feature request',
 *     column_id: info.columns[0].id,
 *     description: 'Add dark mode support',
 *     priority: 'medium'
 * });
 *
 * // Add a comment
 * await client.addComment(newTicket.id, {
 *     content: 'This is important for accessibility!'
 * });
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
