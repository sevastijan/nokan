/**
 * Nokan Client SDK - Main Client Class
 */

import {
    NokanError,
    AuthenticationError,
    PermissionError,
    RateLimitError,
    NotFoundError,
    ValidationError,
    NetworkError,
    TimeoutError,
} from './errors';
import type {
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
export class NokanClient {
    private readonly baseUrl: string;
    private readonly token: string;
    private readonly timeout: number;

    private boardId: string | null = null;
    private permissions: { read: boolean; write: boolean; delete: boolean } | null = null;
    private connected: boolean = false;

    constructor(config: NokanClientConfig) {
        if (!config.token) {
            throw new ValidationError('Token is required');
        }

        this.token = config.token;
        this.baseUrl = config.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
        this.timeout = config.timeout || 30000;

        if (!this.baseUrl) {
            throw new ValidationError('baseUrl is required when running in non-browser environment');
        }
    }

    /**
     * Connect to the API and discover board information
     * This method must be called before using other methods
     *
     * @returns Board info including permissions, columns, and statuses
     */
    async connect(): Promise<ApiTokenInfo> {
        const response = await this.request<ApiResponse<Board>>('GET', '/api/public/board');

        this.boardId = response.data.id;
        this.permissions = response.data.permissions;
        this.connected = true;

        return {
            boardId: response.data.id,
            boardTitle: response.data.title,
            permissions: response.data.permissions,
            columns: response.data.columns,
            statuses: response.data.statuses,
        };
    }

    /**
     * Get current board information
     * Requires: connect() to be called first, read permission
     */
    async getBoard(): Promise<Board> {
        this.ensureConnected();
        this.checkPermission('read');

        const response = await this.request<ApiResponse<Board>>('GET', '/api/public/board');
        return response.data;
    }

    /**
     * List tickets with pagination and filtering
     * Requires: read permission
     *
     * @param options - Pagination and filter options
     */
    async listTickets(options?: ListTicketsOptions): Promise<PaginatedResponse<Ticket>> {
        this.ensureConnected();
        this.checkPermission('read');

        const params = new URLSearchParams();
        if (options?.page) params.set('page', String(options.page));
        if (options?.limit) params.set('limit', String(options.limit));
        if (options?.column_id) params.set('column_id', options.column_id);
        if (options?.status_id) params.set('status_id', options.status_id);
        if (options?.completed !== undefined) params.set('completed', String(options.completed));

        const queryString = params.toString();
        const url = `/api/public/tickets${queryString ? `?${queryString}` : ''}`;

        return await this.request<PaginatedResponse<Ticket>>('GET', url);
    }

    /**
     * Get a single ticket by ID with comments and attachments
     * Requires: read permission
     *
     * @param ticketId - Ticket UUID
     */
    async getTicket(ticketId: string): Promise<TicketDetail> {
        this.ensureConnected();
        this.checkPermission('read');

        if (!ticketId) {
            throw new ValidationError('Ticket ID is required');
        }

        const response = await this.request<ApiResponse<TicketDetail>>('GET', `/api/public/tickets/${ticketId}`);
        return response.data;
    }

    /**
     * Create a new ticket
     * Requires: write permission
     *
     * @param input - Ticket data
     */
    async createTicket(input: CreateTicketInput): Promise<Ticket> {
        this.ensureConnected();
        this.checkPermission('write');

        if (!input.title?.trim()) {
            throw new ValidationError('Title is required', 'title');
        }
        if (!input.column_id) {
            throw new ValidationError('Column ID is required', 'column_id');
        }

        const response = await this.request<ApiResponse<Ticket>>('POST', '/api/public/tickets', input);
        return response.data;
    }

    /**
     * Update an existing ticket
     * Requires: write permission
     *
     * @param ticketId - Ticket UUID
     * @param input - Fields to update
     */
    async updateTicket(ticketId: string, input: UpdateTicketInput): Promise<Ticket> {
        this.ensureConnected();
        this.checkPermission('write');

        if (!ticketId) {
            throw new ValidationError('Ticket ID is required');
        }
        if (!input || Object.keys(input).length === 0) {
            throw new ValidationError('At least one field to update is required');
        }

        const response = await this.request<ApiResponse<Ticket>>('PUT', `/api/public/tickets/${ticketId}`, input);
        return response.data;
    }

    /**
     * Delete a ticket
     * Requires: delete permission
     *
     * @param ticketId - Ticket UUID
     */
    async deleteTicket(ticketId: string): Promise<void> {
        this.ensureConnected();
        this.checkPermission('delete');

        if (!ticketId) {
            throw new ValidationError('Ticket ID is required');
        }

        await this.request<{ success: boolean }>('DELETE', `/api/public/tickets/${ticketId}`);
    }

    /**
     * Add a comment to a ticket
     * Requires: write permission
     *
     * @param ticketId - Ticket UUID
     * @param input - Comment content
     */
    async addComment(ticketId: string, input: CreateCommentInput): Promise<Comment> {
        this.ensureConnected();
        this.checkPermission('write');

        if (!ticketId) {
            throw new ValidationError('Ticket ID is required');
        }
        if (!input.content?.trim()) {
            throw new ValidationError('Comment content is required', 'content');
        }

        const response = await this.request<ApiResponse<Comment>>(
            'POST',
            `/api/public/tickets/${ticketId}/comments`,
            input
        );
        return response.data;
    }

    /**
     * List comments for a ticket
     * Requires: read permission
     *
     * @param ticketId - Ticket UUID
     */
    async listComments(ticketId: string): Promise<Comment[]> {
        this.ensureConnected();
        this.checkPermission('read');

        if (!ticketId) {
            throw new ValidationError('Ticket ID is required');
        }

        const response = await this.request<ApiResponse<Comment[]>>(
            'GET',
            `/api/public/tickets/${ticketId}/comments`
        );
        return response.data;
    }

    /**
     * Upload an attachment to a ticket
     * Requires: write permission
     *
     * @param ticketId - Ticket UUID
     * @param file - File to upload (File, Blob, or Buffer)
     * @param fileName - File name (required if using Blob/Buffer)
     */
    async addAttachment(
        ticketId: string,
        file: File | Blob,
        fileName?: string
    ): Promise<Attachment> {
        this.ensureConnected();
        this.checkPermission('write');

        if (!ticketId) {
            throw new ValidationError('Ticket ID is required');
        }
        if (!file) {
            throw new ValidationError('File is required');
        }

        const formData = new FormData();
        const name = fileName || (file instanceof File ? file.name : 'attachment');
        formData.append('file', file, name);

        const response = await fetch(`${this.baseUrl}/api/public/tickets/${ticketId}/attachments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            await this.handleErrorResponse(response);
        }

        const result = (await response.json()) as ApiResponse<Attachment>;
        return result.data;
    }

    /**
     * List attachments for a ticket
     * Requires: read permission
     *
     * @param ticketId - Ticket UUID
     */
    async listAttachments(ticketId: string): Promise<Attachment[]> {
        this.ensureConnected();
        this.checkPermission('read');

        if (!ticketId) {
            throw new ValidationError('Ticket ID is required');
        }

        const response = await this.request<ApiResponse<Attachment[]>>(
            'GET',
            `/api/public/tickets/${ticketId}/attachments`
        );
        return response.data;
    }

    /**
     * Check if connected to the API
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Get current board ID (after connect)
     */
    getBoardId(): string | null {
        return this.boardId;
    }

    /**
     * Get current permissions (after connect)
     */
    getPermissions(): { read: boolean; write: boolean; delete: boolean } | null {
        return this.permissions;
    }

    // === Private Methods ===

    private ensureConnected(): void {
        if (!this.connected || !this.boardId) {
            throw new NokanError('Not connected. Call connect() first.');
        }
    }

    private checkPermission(permission: 'read' | 'write' | 'delete'): void {
        if (!this.permissions || !this.permissions[permission]) {
            throw new PermissionError(`Token does not have '${permission}' permission`, permission);
        }
    }

    private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            return (await response.json()) as T;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof NokanError) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new TimeoutError(`Request timeout after ${this.timeout}ms`);
                }
                throw new NetworkError(error.message);
            }

            throw new NetworkError('Unknown network error');
        }
    }

    private async handleErrorResponse(response: Response): Promise<never> {
        let errorMessage = 'Unknown error';

        try {
            const errorBody = (await response.json()) as { error?: string };
            errorMessage = errorBody.error || errorMessage;
        } catch {
            // Failed to parse error body
        }

        const retryAfter = response.headers.get('Retry-After');

        switch (response.status) {
            case 401:
                throw new AuthenticationError(errorMessage);
            case 403:
                throw new PermissionError(errorMessage);
            case 404:
                throw new NotFoundError(errorMessage);
            case 429:
                throw new RateLimitError(errorMessage, retryAfter ? parseInt(retryAfter) : undefined);
            case 400:
                throw new ValidationError(errorMessage);
            default:
                throw new NokanError(errorMessage, response.status);
        }
    }
}
