/**
 * Types for Public API
 */

export interface ApiTokenPermissions {
    read: boolean;
    write: boolean;
    delete: boolean;
}

export interface BoardApiToken {
    id: string;
    board_id: string;
    token_hash: string;
    token_prefix: string;
    name: string | null;
    permissions: ApiTokenPermissions;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    last_used_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    rate_limit_per_minute: number;
}

export interface BoardApiTokenListItem {
    id: string;
    token_prefix: string;
    name: string | null;
    permissions: ApiTokenPermissions;
    is_active: boolean;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
}

export interface CreateTokenInput {
    name?: string;
    permissions?: Partial<ApiTokenPermissions>;
    expires_at?: string | null;
}

export interface CreateTokenResponse {
    id: string;
    token: string; // Full token - shown only once!
    token_prefix: string;
    name: string | null;
    permissions: ApiTokenPermissions;
    created_at: string;
    expires_at: string | null;
}

export interface PublicApiContext {
    boardId: string;
    tokenId: string;
    permissions: ApiTokenPermissions;
    rateLimitPerMinute: number;
}

export interface PublicApiResponse<T> {
    data: T;
    meta?: {
        pagination?: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
        rate_limit?: {
            remaining: number;
            reset_at: string;
        };
    };
}

export interface PublicApiErrorResponse {
    error: string;
    code?: string;
    details?: Record<string, unknown>;
}

export interface PublicBoardInfo {
    id: string;
    title: string;
    columns: Array<{ id: string; title: string; order: number }>;
    statuses: Array<{ id: string; label: string; color: string }>;
    priorities: Array<{ id: string; label: string; color: string }>;
    permissions: ApiTokenPermissions;
    created_at: string;
    updated_at: string;
}

export interface PublicTicket {
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

export interface PublicTicketDetail extends PublicTicket {
    comments?: Array<{
        id: string;
        content: string;
        created_at: string;
        author?: { name: string };
    }>;
    attachments?: Array<{
        id: string;
        file_name: string;
        file_size: number;
        mime_type: string;
        created_at: string;
    }>;
}

export interface CreateTicketInput {
    title: string;
    column_id?: string; // Optional - defaults to first column (Backlog)
    description?: string;
    priority?: string;
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
    content: string;
    author_email?: string; // Email of the comment author (for API comments)
}

export interface PublicComment {
    id: string;
    content: string;
    created_at: string;
    author?: { name: string };
}
