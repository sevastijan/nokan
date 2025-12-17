import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

/**
 * Nokan Client SDK - Type Definitions
 *
 * @remarks
 * This module contains all TypeScript interfaces for the Nokan Client SDK.
 *
 * @packageDocumentation
 */
/**
 * Configuration options for NokanClient
 *
 * @example
 * ```typescript
 * const config: NokanClientConfig = {
 *     token: 'nkn_live_xxx',
 *     baseUrl: 'https://your-app.vercel.app',
 *     timeout: 30000
 * };
 * ```
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
/**
 * Board information returned by `client.connect()`
 *
 * @remarks
 * Contains all the information needed to interact with a board,
 * including available columns, statuses, and priorities.
 *
 * @example
 * ```typescript
 * const info = await client.connect();
 * console.log(info.boardTitle);
 * console.log(info.priorities); // Available priorities with colors
 * ```
 */
interface ApiTokenInfo {
    /** Board UUID */
    boardId: string;
    /** Board display name */
    boardTitle: string;
    /** Token permissions */
    permissions: {
        /** Can read tickets, comments, attachments */
        read: boolean;
        /** Can create/update tickets, add comments/attachments */
        write: boolean;
        /** Can delete tickets */
        delete: boolean;
    };
    /** Available columns (e.g., Backlog, In Progress, Done) */
    columns: Array<{
        id: string;
        title: string;
        order: number;
    }>;
    /** Available statuses with colors */
    statuses: Array<{
        id: string;
        label: string;
        color: string;
    }>;
    /** Available priorities with colors (e.g., Low, Medium, High) */
    priorities: Array<{
        id: string;
        label: string;
        color: string;
    }>;
}
/**
 * Full board information returned by `client.getBoard()`
 */
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
    priorities: Array<{
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
/**
 * Ticket data returned by list and create operations
 */
interface Ticket {
    /** Ticket UUID */
    id: string;
    /** Ticket title */
    title: string;
    /** Ticket description (markdown supported) */
    description: string | null;
    /** Priority ID (use with priorities from ApiTokenInfo) */
    priority: string;
    /** Column ID where ticket is located */
    column_id: string;
    /** Status ID (optional) */
    status_id: string | null;
    /** Whether ticket is marked as completed */
    completed: boolean;
    /** ISO 8601 timestamp */
    created_at: string;
    /** ISO 8601 timestamp */
    updated_at: string;
    /** Column details (included in responses) */
    column?: {
        id: string;
        title: string;
    };
    /** Status details with color (included in responses) */
    status?: {
        id: string;
        label: string;
        color: string;
    } | null;
}
/**
 * Detailed ticket information including comments and attachments
 * Returned by `client.getTicket()`
 */
interface TicketDetail extends Ticket {
    /** List of comments on this ticket */
    comments?: Comment[];
    /** List of file attachments */
    attachments?: Attachment[];
}
/**
 * Comment on a ticket
 */
interface Comment {
    id: string;
    /** Comment text content */
    content: string;
    /** ISO 8601 timestamp */
    created_at: string;
    /** Comment author info */
    author?: {
        name: string;
    };
}
/**
 * File attachment on a ticket
 */
interface Attachment {
    id: string;
    /** Original file name */
    file_name: string;
    /** File size in bytes */
    file_size: number;
    /** MIME type (e.g., 'image/png', 'application/pdf') */
    mime_type: string;
    /** ISO 8601 timestamp */
    created_at: string;
}
interface CreateTicketInput {
    /**
     * Ticket title (required)
     */
    title: string;
    /**
     * Column ID where ticket will be created
     * Optional - defaults to first column (Backlog)
     */
    column_id?: string;
    /**
     * Ticket description
     */
    description?: string;
    /**
     * Priority - can be label (e.g. "High", "Medium") or UUID
     * Use priorities from board info to get available options
     */
    priority?: string;
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
     * @param input - Ticket data (column_id is optional, defaults to first column)
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
    /** Hide column selector (will use first column as default) */
    hideColumn?: boolean;
    /** Hide priority selector */
    hidePriority?: boolean;
    /** Default priority label */
    defaultPriority?: string;
    /** Show attachment upload field */
    showAttachment?: boolean;
    /** Hide attachment field */
    hideAttachment?: boolean;
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
    fileInput?: React.CSSProperties;
    fileButton?: React.CSSProperties;
    fileList?: React.CSSProperties;
    fileItem?: React.CSSProperties;
    removeButton?: React.CSSProperties;
}
declare function TicketForm({ client, onSuccess, onError, className, hideColumn, hidePriority, defaultPriority, showAttachment, hideAttachment, }: TicketFormProps): react_jsx_runtime.JSX.Element;

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
