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

    // Fetch board with columns and statuses
    const { data: board, error } = await supabase
        .from('boards')
        .select(`
            id,
            title,
            created_at,
            updated_at,
            columns:columns!columns_board_id_fkey(id, title, order),
            statuses:statuses!statuses_board_id_fkey(id, label, color)
        `)
        .eq('id', context.boardId)
        .single();

    if (error || !board) {
        return successResponse(
            { error: 'Board not found' },
            headers,
            404
        );
    }

    // Sort columns by order
    const sortedColumns = (board.columns || []).sort(
        (a: { order: number }, b: { order: number }) => a.order - b.order
    );

    const response: PublicApiResponse<PublicBoardInfo> = {
        data: {
            id: board.id,
            title: board.title,
            columns: sortedColumns.map((c: { id: string; title: string; order: number }) => ({
                id: c.id,
                title: c.title,
                order: c.order,
            })),
            statuses: (board.statuses || []).map((s: { id: string; label: string; color: string }) => ({
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
