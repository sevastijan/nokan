/**
 * POST /api/public/tickets/[id]/comments
 * Add a comment to a ticket
 * Requires: write permission
 */

import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authenticatePublicApi, successResponse } from '@/app/lib/public-api/auth-middleware';
import type { PublicComment, PublicApiResponse, CreateCommentInput } from '@/app/lib/public-api/types';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/public/tickets/[id]/comments
 * List comments for a ticket
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await authenticatePublicApi(request, 'read');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { id: ticketId } = await params;
    const supabase = getSupabaseAdmin();

    // Verify ticket belongs to board
    const { data: ticket, error: ticketError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', ticketId)
        .eq('board_id', context.boardId)
        .single();

    if (ticketError || !ticket) {
        return successResponse({ error: 'Ticket not found' }, headers, 404);
    }

    // Fetch comments
    const { data: comments, error } = await supabase
        .from('task_comments')
        .select(`
            id, content, created_at,
            users(name)
        `)
        .eq('task_id', ticketId)
        .is('parent_id', null) // Top-level comments only
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return successResponse({ error: 'Failed to fetch comments' }, headers, 500);
    }

    interface RawComment {
        id: string;
        content: string;
        created_at: string;
        users: { name: string } | { name: string }[] | null;
    }

    const mappedComments: PublicComment[] = (comments || []).map((c: RawComment) => {
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
            author_name: authorName,
        };
    });

    const response: PublicApiResponse<PublicComment[]> = {
        data: mappedComments,
    };

    return successResponse(response, headers);
}

/**
 * POST /api/public/tickets/[id]/comments
 * Add a comment to a ticket
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await authenticatePublicApi(request, 'write');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const { id: ticketId } = await params;

    // Parse request body
    let body: CreateCommentInput;
    try {
        body = await request.json();
    } catch {
        return successResponse({ error: 'Invalid JSON body' }, headers, 400);
    }

    const { content } = body;

    // Validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return successResponse({ error: 'content is required and must be non-empty string' }, headers, 400);
    }

    const supabase = getSupabaseAdmin();

    // Verify ticket belongs to board
    const { data: ticket, error: ticketError } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', ticketId)
        .eq('board_id', context.boardId)
        .single();

    if (ticketError || !ticket) {
        return successResponse({ error: 'Ticket not found' }, headers, 404);
    }

    // Create comment
    // Note: user_id will be null for API-created comments (we could store token_id instead)
    const { data: comment, error } = await supabase
        .from('task_comments')
        .insert({
            task_id: ticketId,
            content: content.trim(),
            user_id: null, // API comment - no user
        })
        .select('id, content, created_at')
        .single();

    if (error) {
        console.error('Error creating comment:', error);
        return successResponse({ error: 'Failed to create comment' }, headers, 500);
    }

    const response: PublicApiResponse<PublicComment> = {
        data: {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            author_name: 'API',
        },
    };

    return successResponse(response, headers, 201);
}
