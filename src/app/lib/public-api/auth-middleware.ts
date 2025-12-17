/**
 * Authentication middleware for Public API
 * Validates API tokens and checks permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabase';
import { hashToken, validateTokenFormat, extractTokenFromHeader } from './token-utils';
import { checkRateLimit, getRateLimitHeaders } from './rate-limiter';
import type { PublicApiContext, ApiTokenPermissions, PublicApiErrorResponse } from './types';

export type AuthResult =
    | { success: true; context: PublicApiContext }
    | { success: false; error: NextResponse<PublicApiErrorResponse> };

/**
 * Validate API token from request
 * Returns context with boardId, tokenId, and permissions if valid
 */
export async function validatePublicApiToken(request: NextRequest): Promise<AuthResult> {
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Missing or invalid Authorization header. Expected: Bearer <token>' },
                { status: 401 }
            ),
        };
    }

    // Quick format validation
    if (!validateTokenFormat(token)) {
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Invalid token format' },
                { status: 401 }
            ),
        };
    }

    // Hash token and look up in database
    const tokenHash = hashToken(token);
    const supabase = getSupabaseAdmin();

    const { data: tokenData, error } = await supabase
        .from('board_api_tokens')
        .select('id, board_id, permissions, is_active, expires_at, rate_limit_per_minute')
        .eq('token_hash', tokenHash)
        .single();

    if (error || !tokenData) {
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Invalid or unknown token' },
                { status: 401 }
            ),
        };
    }

    // Check if token is active
    if (!tokenData.is_active) {
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Token has been revoked' },
                { status: 401 }
            ),
        };
    }

    // Check expiration
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
        return {
            success: false,
            error: NextResponse.json(
                { error: 'Token has expired' },
                { status: 401 }
            ),
        };
    }

    // Update last_used_at (fire and forget)
    supabase
        .from('board_api_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', tokenData.id)
        .then(() => {});

    return {
        success: true,
        context: {
            boardId: tokenData.board_id,
            tokenId: tokenData.id,
            permissions: tokenData.permissions as ApiTokenPermissions,
            rateLimitPerMinute: tokenData.rate_limit_per_minute || 60,
        },
    };
}

/**
 * Check if token has specific permission
 */
export function checkPermission(
    context: PublicApiContext,
    requiredPermission: keyof ApiTokenPermissions
): boolean {
    return context.permissions[requiredPermission] === true;
}

/**
 * Create error response for missing permission
 */
export function permissionDeniedResponse(permission: string): NextResponse<PublicApiErrorResponse> {
    return NextResponse.json(
        { error: `Token does not have '${permission}' permission` },
        { status: 403 }
    );
}

/**
 * Apply rate limiting and return error response if exceeded
 */
export function applyRateLimit(
    context: PublicApiContext
): { allowed: true; headers: Record<string, string> } | { allowed: false; error: NextResponse<PublicApiErrorResponse> } {
    const result = checkRateLimit(context.tokenId, context.rateLimitPerMinute);
    const headers = getRateLimitHeaders(result);

    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        return {
            allowed: false,
            error: NextResponse.json(
                { error: 'Rate limit exceeded. Please retry later.' },
                {
                    status: 429,
                    headers: {
                        ...headers,
                        'Retry-After': String(retryAfter),
                    },
                }
            ),
        };
    }

    return { allowed: true, headers };
}

/**
 * Combined authentication and rate limiting check
 * Use this as the first step in all public API endpoints
 */
export async function authenticatePublicApi(
    request: NextRequest,
    requiredPermission?: keyof ApiTokenPermissions
): Promise<
    | { success: true; context: PublicApiContext; headers: Record<string, string> }
    | { success: false; error: NextResponse<PublicApiErrorResponse> }
> {
    // 1. Validate token
    const authResult = await validatePublicApiToken(request);
    if (!authResult.success) {
        return authResult;
    }

    const { context } = authResult;

    // 2. Check permission if required
    if (requiredPermission && !checkPermission(context, requiredPermission)) {
        return {
            success: false,
            error: permissionDeniedResponse(requiredPermission),
        };
    }

    // 3. Apply rate limiting
    const rateResult = applyRateLimit(context);
    if (!rateResult.allowed) {
        return { success: false, error: rateResult.error };
    }

    return {
        success: true,
        context,
        headers: rateResult.headers,
    };
}

/**
 * Helper to create successful JSON response with rate limit headers
 */
export function successResponse<T>(
    data: T,
    headers: Record<string, string>,
    status: number = 200
): NextResponse {
    return NextResponse.json(data, { status, headers });
}
