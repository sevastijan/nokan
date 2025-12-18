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
export interface NokanClientConfig {
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
export interface ApiTokenInfo {
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
    columns: Array<{ id: string; title: string; order: number }>;
    /** Available statuses with colors */
    statuses: Array<{ id: string; label: string; color: string }>;
    /** Available priorities with colors (e.g., Low, Medium, High) */
    priorities: Array<{ id: string; label: string; color: string }>;
}

/**
 * Full board information returned by `client.getBoard()`
 */
export interface Board {
    id: string;
    title: string;
    columns: Array<{ id: string; title: string; order: number }>;
    statuses: Array<{ id: string; label: string; color: string }>;
    priorities: Array<{ id: string; label: string; color: string }>;
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
export interface Ticket {
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
    column?: { id: string; title: string };
    /** Status details with color (included in responses) */
    status?: { id: string; label: string; color: string } | null;
}

/**
 * Detailed ticket information including comments and attachments
 * Returned by `client.getTicket()`
 */
export interface TicketDetail extends Ticket {
    /** List of comments on this ticket */
    comments?: Comment[];
    /** List of file attachments */
    attachments?: Attachment[];
}

/**
 * Comment on a ticket
 */
export interface Comment {
    id: string;
    /** Comment text content */
    content: string;
    /** ISO 8601 timestamp */
    created_at: string;
    /** Comment author info */
    author?: { name: string };
}

/**
 * File attachment on a ticket
 */
export interface Attachment {
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

export interface CreateTicketInput {
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

export interface UpdateTicketInput {
    title?: string;
    description?: string;
    priority?: string;
    column_id?: string;
    status_id?: string;
    completed?: boolean;
}

export interface CreateCommentInput {
    /**
     * Comment content (required)
     */
    content: string;

    /**
     * Author email (required for API comments)
     * This email will be displayed as the comment author
     */
    author_email: string;
}

export interface ListTicketsOptions {
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

export interface PaginatedResponse<T> {
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

export interface ApiResponse<T> {
    data: T;
    meta?: {
        rate_limit?: {
            remaining: number;
            reset_at: string;
        };
    };
}
