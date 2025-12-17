/**
 * API Routes for managing board API tokens
 * These endpoints require NextAuth session (board owner/manager)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { generateApiToken } from '@/app/lib/public-api/token-utils';
import type {
    BoardApiTokenListItem,
    CreateTokenInput,
    CreateTokenResponse,
    ApiTokenPermissions,
} from '@/app/lib/public-api/types';

interface RouteParams {
    params: Promise<{ boardId: string }>;
}

/**
 * GET /api/board-settings/[boardId]/api-tokens
 * List all API tokens for a board
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await params;
    const supabase = getSupabaseAdmin();

    // Get user's internal ID from google_id
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('google_id', session.user.id)
        .single();

    if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this board (owner)
    const { data: board } = await supabase
        .from('boards')
        .select('id, user_id')
        .eq('id', boardId)
        .single();

    if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.user_id !== userData.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch tokens
    const { data: tokens, error } = await supabase
        .from('board_api_tokens')
        .select('id, token_prefix, name, permissions, is_active, created_at, last_used_at, expires_at')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
    }

    const result: BoardApiTokenListItem[] = tokens || [];
    return NextResponse.json({ data: result });
}

/**
 * POST /api/board-settings/[boardId]/api-tokens
 * Create a new API token for the board
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await params;
    const supabase = getSupabaseAdmin();

    // Get user's internal ID
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('google_id', session.user.id)
        .single();

    if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check board ownership
    const { data: board } = await supabase
        .from('boards')
        .select('id, user_id')
        .eq('id', boardId)
        .single();

    if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.user_id !== userData.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse request body
    let body: CreateTokenInput = {};
    try {
        body = await request.json();
    } catch {
        // Empty body is OK, use defaults
    }

    const { name, permissions, expires_at } = body;

    // Default permissions
    const tokenPermissions: ApiTokenPermissions = {
        read: permissions?.read ?? true,
        write: permissions?.write ?? false,
        delete: permissions?.delete ?? false,
    };

    // Generate token
    const { token, hash, prefix } = generateApiToken();

    // Insert into database
    const { data: tokenRecord, error } = await supabase
        .from('board_api_tokens')
        .insert({
            board_id: boardId,
            token_hash: hash,
            token_prefix: prefix,
            name: name || 'API Token',
            permissions: tokenPermissions,
            created_by: userData.id,
            expires_at: expires_at || null,
        })
        .select('id, token_prefix, name, permissions, created_at, expires_at')
        .single();

    if (error) {
        console.error('Error creating token:', error);
        return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    // Return token - THIS IS THE ONLY TIME IT WILL BE SHOWN
    const response: CreateTokenResponse = {
        id: tokenRecord.id,
        token, // Full token!
        token_prefix: tokenRecord.token_prefix,
        name: tokenRecord.name,
        permissions: tokenRecord.permissions as ApiTokenPermissions,
        created_at: tokenRecord.created_at,
        expires_at: tokenRecord.expires_at,
    };

    return NextResponse.json(
        {
            data: response,
            warning: 'This is the only time the full token will be shown. Please save it securely.',
        },
        { status: 201 }
    );
}

/**
 * PATCH /api/board-settings/[boardId]/api-tokens?tokenId=xxx
 * Update token (name, permissions, active status)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await params;
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
        return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('google_id', session.user.id)
        .single();

    if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: board } = await supabase
        .from('boards')
        .select('id, user_id')
        .eq('id', boardId)
        .single();

    if (!board || board.user_id !== userData.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse updates
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.permissions !== undefined) updates.permissions = body.permissions;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.expires_at !== undefined) updates.expires_at = body.expires_at;

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
        .from('board_api_tokens')
        .update(updates)
        .eq('id', tokenId)
        .eq('board_id', boardId)
        .select('id, token_prefix, name, permissions, is_active, created_at, last_used_at, expires_at')
        .single();

    if (error) {
        console.error('Error updating token:', error);
        return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/board-settings/[boardId]/api-tokens?tokenId=xxx
 * Revoke (soft delete) a token
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await params;
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
        return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify ownership
    const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('google_id', session.user.id)
        .single();

    if (!userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: board } = await supabase
        .from('boards')
        .select('id, user_id')
        .eq('id', boardId)
        .single();

    if (!board || board.user_id !== userData.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Soft delete - deactivate the token
    const { error } = await supabase
        .from('board_api_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)
        .eq('board_id', boardId);

    if (error) {
        console.error('Error revoking token:', error);
        return NextResponse.json({ error: 'Failed to revoke token' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Token revoked successfully' });
}
