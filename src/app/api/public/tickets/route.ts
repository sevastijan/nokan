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

    // Build query - use foreign key hint to resolve ambiguity with columns table
    let query = supabase
        .from('tasks')
        .select(`
            id, title, description, priority, column_id, status_id, completed, created_at, updated_at,
            columns!tasks_column_id_fkey(id, title)
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

    // Fetch statuses for this board to map status_id to label/color
    const { data: statuses } = await supabase
        .from('statuses')
        .select('id, label, color')
        .eq('board_id', context.boardId);

    const statusMap = new Map<string, { id: string; label: string; color: string }>();
    (statuses || []).forEach(s => statusMap.set(s.id, s));

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
        status: t.status_id ? statusMap.get(t.status_id) || null : null,
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

    const { title, column_id: providedColumnId, description, priority, status_id } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return successResponse({ error: 'title is required and must be non-empty string' }, headers, 400);
    }

    const supabase = getSupabaseAdmin();

    // Get column_id - use provided one or default to first column (Backlog)
    let column_id = providedColumnId;

    if (column_id) {
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
    } else {
        // Get first column (lowest order) as default
        const { data: defaultColumn, error: defaultColumnError } = await supabase
            .from('columns')
            .select('id')
            .eq('board_id', context.boardId)
            .order('order', { ascending: true })
            .limit(1)
            .single();

        if (defaultColumnError || !defaultColumn) {
            return successResponse(
                { error: 'No columns found in this board' },
                headers,
                400
            );
        }
        column_id = defaultColumn.id;
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

    // Get default status (first one) if not provided
    let finalStatusId = status_id || null;
    if (!finalStatusId) {
        const { data: defaultStatus } = await supabase
            .from('statuses')
            .select('id')
            .eq('board_id', context.boardId)
            .order('order_index', { ascending: true })
            .limit(1)
            .single();
        finalStatusId = defaultStatus?.id || null;
    }

    // Map priority string to UUID from priorities table (global - not board-specific)
    let priorityId: string | null = null;
    if (priority) {
        // Try to find priority by label (case-insensitive)
        const { data: priorityData } = await supabase
            .from('priorities')
            .select('id, label')
            .ilike('label', priority)
            .limit(1)
            .single();

        if (priorityData) {
            priorityId = priorityData.id;
        } else {
            // If not found by label, check if it's a valid UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(priority)) {
                const { data: priorityById } = await supabase
                    .from('priorities')
                    .select('id')
                    .eq('id', priority)
                    .single();
                if (priorityById) {
                    priorityId = priorityById.id;
                }
            }
        }
    }

    // Create ticket
    const { data: ticket, error } = await supabase
        .from('tasks')
        .insert({
            title: title.trim(),
            description: description || '',
            priority: priorityId,
            column_id,
            board_id: context.boardId,
            status_id: finalStatusId,
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
        console.error('Insert data was:', {
            title: title.trim(),
            description: description || '',
            priority: priority || 'medium',
            column_id,
            board_id: context.boardId,
            status_id: status_id || null,
            sort_order: nextSortOrder,
            type: 'task',
        });
        return successResponse({ error: 'Failed to create ticket', details: error.message }, headers, 500);
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
