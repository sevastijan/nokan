/**
 * GET /api/public/board
 * Returns board info, columns, statuses, and token permissions
 * Requires: read permission
 */

import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { authenticatePublicApi, successResponse } from '@/app/lib/public-api/auth-middleware';
import type { PublicBoardInfo, PublicApiResponse } from '@/app/lib/public-api/types';

export async function GET(request: NextRequest) {
    // Authenticate and check permissions
    const auth = await authenticatePublicApi(request, 'read');
    if (!auth.success) {
        return auth.error;
    }

    const { context, headers } = auth;
    const supabase = getSupabaseAdmin();

    // Fetch board
    const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('id, title, created_at, updated_at')
        .eq('id', context.boardId)
        .single();

    if (boardError || !board) {
        console.error('Board fetch error:', boardError, 'boardId:', context.boardId);
        return successResponse(
            { error: 'Board not found', details: boardError?.message },
            headers,
            404
        );
    }

    // Fetch columns separately
    const { data: columns } = await supabase
        .from('columns')
        .select('id, title, order')
        .eq('board_id', context.boardId)
        .order('order', { ascending: true });

    // Fetch statuses separately
    const { data: statuses } = await supabase
        .from('statuses')
        .select('id, label, color')
        .eq('board_id', context.boardId);


    const response: PublicApiResponse<PublicBoardInfo> = {
        data: {
            id: board.id,
            title: board.title,
            columns: (columns || []).map((c) => ({
                id: c.id,
                title: c.title,
                order: c.order,
            })),
            statuses: (statuses || []).map((s) => ({
                id: s.id,
                label: s.label,
                color: s.color,
            })),
            permissions: context.permissions,
            created_at: board.created_at,
            updated_at: board.updated_at,
        },
    };

    return successResponse(response, headers);
}
