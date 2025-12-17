import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

/**
 * Nokan Client SDK - Types
 */
interface NokanClientConfig {
    /**
     * API token generated from board settings
     * Format: nkn_live_xxx
     */
    token: string;
    /**
     * Base URL of the Nokan API
     * @default 'https://your-app.vercel.app' or window.location.origin
     */
    baseUrl?: string;
    /**
     * Request timeout in milliseconds
     * @default 30000
     */
    timeout?: number;
}
interface ApiTokenInfo {
    boardId: string;
    boardTitle: string;
    permissions: {
        read: boolean;
        write: boolean;
        delete: boolean;
    };
    columns: Array<{
        id: string;
        title: string;
        order: number;
    }>;
    statuses: Array<{
        id: string;
        label: string;
        color: string;
    }>;
}
interface Board {
    id: string;
    title: string;
    columns: Array<{
        id: string;
        title: string;
        order: number;
    }>;
    statuses: Array<{
        id: string;
        label: string;
        color: string;
    }>;
    permissions: {
        read: boolean;
        write: boolean;
        delete: boolean;
    };
    created_at: string;
    updated_at: string;
}
interface Ticket {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    column_id: string;
    status_id: string | null;
    completed: boolean;
    created_at: string;
    updated_at: string;
    column?: {
        id: string;
        title: string;
    };
    status?: {
        id: string;
        label: string;
        color: string;
    } | null;
}
interface TicketDetail extends Ticket {
    comments?: Comment[];
    attachments?: Attachment[];
}
interface Comment {
    id: string;
    content: string;
    created_at: string;
    author?: {
        name: string;
    };
}
interface Attachment {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    created_at: string;
}
interface CreateTicketInput {
    /**
     * Ticket title (required)
     */
    title: string;
    /**
     * Column ID where ticket will be created (required)
     */
    column_id: string;
    /**
     * Ticket description
     */
    description?: string;
    /**
     * Priority level
     * @default 'medium'
     */
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    /**
     * Status ID
     */
    status_id?: string;
}
interface UpdateTicketInput {
    title?: string;
    description?: string;
    priority?: string;
    column_id?: string;
    status_id?: string;
    completed?: boolean;
}
interface CreateCommentInput {
    /**
     * Comment content (required)
     */
    content: string;
}
interface ListTicketsOptions {
    /**
     * Page number (1-indexed)
     * @default 1
     */
    page?: number;
    /**
     * Items per page (max 100)
     * @default 50
     */
    limit?: number;
    /**
     * Filter by column ID
     */
    column_id?: string;
    /**
     * Filter by status ID
     */
    status_id?: string;
    /**
     * Filter by completion status
     */
    completed?: boolean;
}
interface PaginatedResponse<T> {
    data: T[];
    meta: {
        pagination: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    };
}
interface ApiResponse<T> {
    data: T;
    meta?: {
        rate_limit?: {
            remaining: number;
            reset_at: string;
        };
    };
}

/**
 * Nokan Client SDK - Main Client Class
 */

/**
 * NokanClient - TypeScript SDK for Nokan Taskboard Public API
 *
 * @example
 * ```typescript
 * const client = new NokanClient({
 *     token: 'nkn_live_xxx',
 *     baseUrl: 'https://your-app.vercel.app'
 * });
 *
 * // Connect and discover board info
 * const info = await client.connect();
 * console.log('Connected to board:', info.boardTitle);
 *
 * // List tickets
 * const tickets = await client.listTickets({ page: 1, limit: 10 });
 *
 * // Create a ticket
 * const newTicket = await client.createTicket({
 *     title: 'Bug report',
 *     column_id: info.columns[0].id,
 *     priority: 'high'
 * });
 * ```
 */
declare class NokanClient {
    private readonly baseUrl;
    private readonly token;
    private readonly timeout;
    private boardId;
    private permissions;
    private connected;
    constructor(config: NokanClientConfig);
    /**
     * Connect to the API and discover board information
     * This method must be called before using other methods
     *
     * @returns Board info including permissions, columns, and statuses
     */
    connect(): Promise<ApiTokenInfo>;
    /**
     * Get current board information
     * Requires: connect() to be called first, read permission
     */
    getBoard(): Promise<Board>;
    /**
     * List tickets with pagination and filtering
     * Requires: read permission
     *
     * @param options - Pagination and filter options
     */
    listTickets(options?: ListTicketsOptions): Promise<PaginatedResponse<Ticket>>;
    /**
     * Get a single ticket by ID with comments and attachments
     * Requires: read permission
     *
     * @param ticketId - Ticket UUID
     */
    getTicket(ticketId: string): Promise<TicketDetail>;
    /**
     * Create a new ticket
     * Requires: write permission
     *
     * @param input - Ticket data
     */
    createTicket(input: CreateTicketInput): Promise<Ticket>;
    /**
     * Update an existing ticket
     * Requires: write permission
     *
     * @param ticketId - Ticket UUID
     * @param input - Fields to update
     */
    updateTicket(ticketId: string, input: UpdateTicketInput): Promise<Ticket>;
    /**
     * Delete a ticket
     * Requires: delete permission
     *
     * @param ticketId - Ticket UUID
     */
    deleteTicket(ticketId: string): Promise<void>;
    /**
     * Add a comment to a ticket
     * Requires: write permission
     *
     * @param ticketId - Ticket UUID
     * @param input - Comment content
     */
    addComment(ticketId: string, input: CreateCommentInput): Promise<Comment>;
    /**
     * List comments for a ticket
     * Requires: read permission
     *
     * @param ticketId - Ticket UUID
     */
    listComments(ticketId: string): Promise<Comment[]>;
    /**
     * Upload an attachment to a ticket
     * Requires: write permission
     *
     * @param ticketId - Ticket UUID
     * @param file - File to upload (File, Blob, or Buffer)
     * @param fileName - File name (required if using Blob/Buffer)
     */
    addAttachment(ticketId: string, file: File | Blob, fileName?: string): Promise<Attachment>;
    /**
     * List attachments for a ticket
     * Requires: read permission
     *
     * @param ticketId - Ticket UUID
     */
    listAttachments(ticketId: string): Promise<Attachment[]>;
    /**
     * Check if connected to the API
     */
    isConnected(): boolean;
    /**
     * Get current board ID (after connect)
     */
    getBoardId(): string | null;
    /**
     * Get current permissions (after connect)
     */
    getPermissions(): {
        read: boolean;
        write: boolean;
        delete: boolean;
    } | null;
    private ensureConnected;
    private checkPermission;
    private request;
    private handleErrorResponse;
}

/**
 * Nokan Client SDK - Error Classes
 */
/**
 * Base error class for Nokan API errors
 */
declare class NokanError extends Error {
    readonly statusCode?: number;
    readonly code?: string;
    constructor(message: string, statusCode?: number, code?: string);
}
/**
 * Thrown when authentication fails (invalid/expired token)
 */
declare class AuthenticationError extends NokanError {
    constructor(message?: string);
}
/**
 * Thrown when the token doesn't have required permission
 */
declare class PermissionError extends NokanError {
    readonly requiredPermission?: string;
    constructor(message?: string, requiredPermission?: string);
}
/**
 * Thrown when rate limit is exceeded
 */
declare class RateLimitError extends NokanError {
    readonly retryAfter?: number;
    readonly resetAt?: Date;
    constructor(message?: string, retryAfter?: number);
}
/**
 * Thrown when requested resource is not found
 */
declare class NotFoundError extends NokanError {
    readonly resourceType?: string;
    readonly resourceId?: string;
    constructor(message?: string, resourceType?: string, resourceId?: string);
}
/**
 * Thrown when request validation fails
 */
declare class ValidationError extends NokanError {
    readonly field?: string;
    constructor(message: string, field?: string);
}
/**
 * Thrown when request times out
 */
declare class TimeoutError extends NokanError {
    constructor(message?: string);
}
/**
 * Thrown when network connection fails
 */
declare class NetworkError extends NokanError {
    constructor(message?: string);
}

interface TicketFormProps {
    client: NokanClient;
    onSuccess?: (ticket: {
        id: string;
        title: string;
    }) => void;
    onError?: (error: Error) => void;
    className?: string;
}
interface TicketFormStyles {
    form?: React.CSSProperties;
    fieldGroup?: React.CSSProperties;
    label?: React.CSSProperties;
    input?: React.CSSProperties;
    textarea?: React.CSSProperties;
    select?: React.CSSProperties;
    button?: React.CSSProperties;
    buttonDisabled?: React.CSSProperties;
    error?: React.CSSProperties;
    success?: React.CSSProperties;
}
declare function TicketForm({ client, onSuccess, onError, className }: TicketFormProps): react_jsx_runtime.JSX.Element;

interface TicketViewProps {
    client: NokanClient;
    ticketId: string;
    onClose?: () => void;
    onUpdate?: (ticket: TicketDetail) => void;
    className?: string;
}
declare function TicketView({ client, ticketId, onClose, onUpdate, className }: TicketViewProps): react_jsx_runtime.JSX.Element;

interface TicketListProps {
    client: NokanClient;
    onTicketClick?: (ticketId: string) => void;
    className?: string;
}
declare function TicketList({ client, onTicketClick, className }: TicketListProps): react_jsx_runtime.JSX.Element;

export { type ApiResponse, type ApiTokenInfo, type Attachment, AuthenticationError, type Board, type Comment, type CreateCommentInput, type CreateTicketInput, type ListTicketsOptions, NetworkError, NokanClient, type NokanClientConfig, NokanError, NotFoundError, type PaginatedResponse, PermissionError, RateLimitError, type Ticket, type TicketDetail, TicketForm, type TicketFormProps, type TicketFormStyles, TicketList, type TicketListProps, TicketView, type TicketViewProps, TimeoutError, type UpdateTicketInput, ValidationError };
