/**
 * Public API: Tickets endpoints
 * GET /api/public/tickets - List tickets (requires read permission)
 * POST /api/public/tickets - Create ticket (requires write permission)
 */

import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authenticatePublicApi, successResponse } from '@/app/lib/public-api/auth-middleware';
import type { PublicTicket, PublicApiResponse, CreateTicketInput } from '@/app/lib/public-api/types';

/**
 * GET /api/public/tickets
 * List tickets with pagination and filtering
 */
export async function GET(request: NextRequest) {
    const auth = await authenticatePublicApi(request, 'read');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    // Filters
    const columnId = searchParams.get('column_id');
    const statusId = searchParams.get('status_id');
    const completed = searchParams.get('completed');

    const supabase = getSupabaseAdmin();

    // Build query
    let query = supabase
        .from('tasks')
        .select(`
            id, title, description, priority, column_id, status_id, completed, created_at, updated_at,
            columns!inner(id, title),
            statuses(id, label, color)
        `, { count: 'exact' })
        .eq('board_id', context.boardId)
        .is('parent_id', null) // Only top-level tasks, not subtasks
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Apply filters
    if (columnId) {
        query = query.eq('column_id', columnId);
    }
    if (statusId) {
        query = query.eq('status_id', statusId);
    }
    if (completed !== null && completed !== undefined) {
        query = query.eq('completed', completed === 'true');
    }

    const { data: tickets, count, error } = await query;

    if (error) {
        console.error('Error fetching tickets:', error);
        return successResponse({ error: 'Failed to fetch tickets' }, headers, 500);
    }

    interface RawTicket {
        id: string;
        title: string;
        description: string | null;
        priority: string;
        column_id: string;
        status_id: string | null;
        completed: boolean;
        created_at: string;
        updated_at: string;
        columns: { id: string; title: string } | { id: string; title: string }[];
        statuses: { id: string; label: string; color: string } | { id: string; label: string; color: string }[] | null;
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

    const mappedTickets: PublicTicket[] = (tickets || []).map((t: RawTicket) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        column_id: t.column_id,
        status_id: t.status_id,
        completed: t.completed,
        created_at: t.created_at,
        updated_at: t.updated_at,
        column: getColumnData(t.columns),
        status: getStatusData(t.statuses),
    }));

    const response: PublicApiResponse<PublicTicket[]> = {
        data: mappedTickets,
        meta: {
            pagination: {
                page,
                limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        },
    };

    return successResponse(response, headers);
}

/**
 * POST /api/public/tickets
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
    const auth = await authenticatePublicApi(request, 'write');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;

    // Parse request body
    let body: CreateTicketInput;
    try {
        body = await request.json();
    } catch {
        return successResponse({ error: 'Invalid JSON body' }, headers, 400);
    }

    const { title, column_id, description, priority, status_id } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return successResponse({ error: 'title is required and must be non-empty string' }, headers, 400);
    }

    if (!column_id || typeof column_id !== 'string') {
        return successResponse({ error: 'column_id is required' }, headers, 400);
    }

    const supabase = getSupabaseAdmin();

    // Verify column belongs to the board
    const { data: column, error: columnError } = await supabase
        .from('columns')
        .select('id')
        .eq('id', column_id)
        .eq('board_id', context.boardId)
        .single();

    if (columnError || !column) {
        return successResponse(
            { error: 'Column not found in this board' },
            headers,
            400
        );
    }

    // Verify status belongs to board (if provided)
    if (status_id) {
        const { data: status, error: statusError } = await supabase
            .from('statuses')
            .select('id')
            .eq('id', status_id)
            .eq('board_id', context.boardId)
            .single();

        if (statusError || !status) {
            return successResponse(
                { error: 'Status not found in this board' },
                headers,
                400
            );
        }
    }

    // Get max sort_order for the column
    const { data: maxOrderData } = await supabase
        .from('tasks')
        .select('sort_order')
        .eq('column_id', column_id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const nextSortOrder = (maxOrderData?.sort_order ?? -1) + 1;

    // Create ticket
    const { data: ticket, error } = await supabase
        .from('tasks')
        .insert({
            title: title.trim(),
            description: description || '',
            priority: priority || 'medium',
            column_id,
            board_id: context.boardId,
            status_id: status_id || null,
            completed: false,
            sort_order: nextSortOrder,
            type: 'task',
        })
        .select(`
            id, title, description, priority, column_id, status_id, completed, created_at, updated_at
        `)
        .single();

    if (error) {
        console.error('Error creating ticket:', error);
        return successResponse({ error: 'Failed to create ticket' }, headers, 500);
    }

    const response: PublicApiResponse<PublicTicket> = {
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

    return successResponse(response, headers, 201);
}
