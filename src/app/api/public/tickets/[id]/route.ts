/**
 * Public API: Single Ticket endpoints
 * GET /api/public/tickets/[id] - Get ticket details (requires read permission)
 * PUT /api/public/tickets/[id] - Update ticket (requires write permission)
 * DELETE /api/public/tickets/[id] - Delete ticket (requires delete permission)
 */

import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authenticatePublicApi, successResponse } from '@/app/lib/public-api/auth-middleware';
import type { PublicTicketDetail, PublicApiResponse, UpdateTicketInput } from '@/app/lib/public-api/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/public/tickets/[id]
 * Get ticket details with comments and attachments
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authenticatePublicApi(request, 'read');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { id: ticketId } = await params;
    const supabase = getSupabaseAdmin();

    const { data: ticket, error } = await supabase
        .from('tasks')
        .select(`
            id, title, description, priority, column_id, status_id, completed, created_at, updated_at,
            columns(id, title),
            statuses(id, label, color),
            task_comments(
                id, content, created_at,
                users(name)
            ),
            task_attachments(
                id, file_name, file_size, mime_type, created_at
            )
        `)
        .eq('id', ticketId)
        .eq('board_id', context.boardId)
        .single();

    if (error || !ticket) {
        return successResponse({ error: 'Ticket not found' }, headers, 404);
    }

    interface RawComment {
        id: string;
        content: string;
        created_at: string;
        users: { name: string } | { name: string }[] | null;
    }

    interface RawAttachment {
        id: string;
        file_name: string;
        file_size: number;
        mime_type: string;
        created_at: string;
    }

    // Helper to extract column data (Supabase may return array or object)
    const getColumnData = (columns: unknown): { id: string; title: string } | undefined => {
        if (!columns) return undefined;
        if (Array.isArray(columns) && columns.length > 0) {
            return { id: columns[0].id, title: columns[0].title };
        }
        if (typeof columns === 'object' && 'id' in columns) {
            return { id: (columns as { id: string; title: string }).id, title: (columns as { id: string; title: string }).title };
        }
        return undefined;
    };

    // Helper to extract status data
    const getStatusData = (statuses: unknown): { id: string; label: string; color: string } | null => {
        if (!statuses) return null;
        if (Array.isArray(statuses) && statuses.length > 0) {
            return { id: statuses[0].id, label: statuses[0].label, color: statuses[0].color };
        }
        if (typeof statuses === 'object' && 'id' in statuses) {
            return statuses as { id: string; label: string; color: string };
        }
        return null;
    };

    const response: PublicApiResponse<PublicTicketDetail> = {
        data: {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            column_id: ticket.column_id,
            status_id: ticket.status_id,
            completed: ticket.completed,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            column: getColumnData(ticket.columns),
            status: getStatusData(ticket.statuses),
            comments: (ticket.task_comments || []).map((c: RawComment) => {
                let authorName: string | undefined;
                if (c.users) {
                    if (Array.isArray(c.users)) {
                        authorName = c.users[0]?.name;
                    } else {
                        authorName = c.users.name;
                    }
                }
                return {
                    id: c.id,
                    content: c.content,
                    created_at: c.created_at,
                    author: authorName ? { name: authorName } : undefined,
                };
            }),
            attachments: (ticket.task_attachments || []).map((a: RawAttachment) => ({
                id: a.id,
                file_name: a.file_name,
                file_size: a.file_size,
                mime_type: a.mime_type,
                created_at: a.created_at,
            })),
        },
    };

    return successResponse(response, headers);
}

/**
 * PUT /api/public/tickets/[id]
 * Update ticket
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await authenticatePublicApi(request, 'write');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { id: ticketId } = await params;

    // Parse request body
    let body: UpdateTicketInput;
    try {
        body = await request.json();
    } catch {
        return successResponse({ error: 'Invalid JSON body' }, headers, 400);
    }

    const supabase = getSupabaseAdmin();

    // Verify ticket belongs to board
    const { data: existing, error: existingError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', ticketId)
        .eq('board_id', context.boardId)
        .single();

    if (existingError || !existing) {
        return successResponse({ error: 'Ticket not found' }, headers, 404);
    }

    // Build updates object
    const allowedFields = ['title', 'description', 'priority', 'column_id', 'status_id', 'completed'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (body[field as keyof UpdateTicketInput] !== undefined) {
            updates[field] = body[field as keyof UpdateTicketInput];
        }
    }

    if (Object.keys(updates).length === 0) {
        return successResponse({ error: 'No valid fields to update' }, headers, 400);
    }

    // Validate column_id if provided
    if (updates.column_id) {
        const { data: column } = await supabase
            .from('columns')
            .select('id')
            .eq('id', updates.column_id as string)
            .eq('board_id', context.boardId)
            .single();

        if (!column) {
            return successResponse({ error: 'Column not found in this board' }, headers, 400);
        }
    }

    // Validate status_id if provided
    if (updates.status_id) {
        const { data: status } = await supabase
            .from('statuses')
            .select('id')
            .eq('id', updates.status_id as string)
            .eq('board_id', context.boardId)
            .single();

        if (!status) {
            return successResponse({ error: 'Status not found in this board' }, headers, 400);
        }
    }

    // Perform update
    const { data: ticket, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', ticketId)
        .select(`
            id, title, description, priority, column_id, status_id, completed, created_at, updated_at
        `)
        .single();

    if (error) {
        console.error('Error updating ticket:', error);
        return successResponse({ error: 'Failed to update ticket' }, headers, 500);
    }

    const response: PublicApiResponse<PublicTicketDetail> = {
        data: {
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority,
            column_id: ticket.column_id,
            status_id: ticket.status_id,
            completed: ticket.completed,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
        },
    };

    return successResponse(response, headers);
}

/**
 * DELETE /api/public/tickets/[id]
 * Delete ticket
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const auth = await authenticatePublicApi(request, 'delete');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { id: ticketId } = await params;
    const supabase = getSupabaseAdmin();

    // Verify ticket belongs to board
    const { data: existing, error: existingError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', ticketId)
        .eq('board_id', context.boardId)
        .single();

    if (existingError || !existing) {
        return successResponse({ error: 'Ticket not found' }, headers, 404);
    }

    // Delete ticket (and its comments/attachments via cascade)
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', ticketId);

    if (error) {
        console.error('Error deleting ticket:', error);
        return successResponse({ error: 'Failed to delete ticket' }, headers, 500);
    }

    return successResponse({ success: true, message: 'Ticket deleted' }, headers);
}
