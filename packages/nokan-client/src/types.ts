/**
 * Nokan Client SDK - Types
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

export interface ApiTokenInfo {
    boardId: string;
    boardTitle: string;
    permissions: {
        read: boolean;
        write: boolean;
        delete: boolean;
    };
    columns: Array<{ id: string; title: string; order: number }>;
    statuses: Array<{ id: string; label: string; color: string }>;
}

export interface Board {
    id: string;
    title: string;
    columns: Array<{ id: string; title: string; order: number }>;
    statuses: Array<{ id: string; label: string; color: string }>;
    permissions: {
        read: boolean;
        write: boolean;
        delete: boolean;
    };
    created_at: string;
    updated_at: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string | null;
    priority: string;
    column_id: string;
    status_id: string | null;
    completed: boolean;
    created_at: string;
    updated_at: string;
    column?: { id: string; title: string };
    status?: { id: string; label: string; color: string } | null;
}

export interface TicketDetail extends Ticket {
    comments?: Comment[];
    attachments?: Attachment[];
}

export interface Comment {
    id: string;
    content: string;
    created_at: string;
    author?: { name: string };
}

export interface Attachment {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    created_at: string;
}

export interface CreateTicketInput {
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
