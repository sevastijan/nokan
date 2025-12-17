/**
 * RTK Query endpoints for managing Board API tokens
 */

import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import type {
    BoardApiTokenListItem,
    CreateTokenInput,
    CreateTokenResponse,
    ApiTokenPermissions,
} from '@/app/lib/public-api/types';

interface ApiTokenResponse {
    data: BoardApiTokenListItem[];
}

interface CreateApiTokenResponse {
    data: CreateTokenResponse;
    warning: string;
}

interface UpdateTokenInput {
    boardId: string;
    tokenId: string;
    name?: string;
    permissions?: ApiTokenPermissions;
    is_active?: boolean;
    expires_at?: string | null;
}

interface DeleteTokenInput {
    boardId: string;
    tokenId: string;
}

export const apiTokenEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
    /**
     * Get all API tokens for a board
     */
    getApiTokens: builder.query<BoardApiTokenListItem[], string>({
        async queryFn(boardId) {
            try {
                const response = await fetch(`/api/board-settings/${boardId}/api-tokens`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { error: { message: error.error || 'Failed to fetch tokens' } };
                }

                const result: ApiTokenResponse = await response.json();
                return { data: result.data };
            } catch (error) {
                return {
                    error: { message: error instanceof Error ? error.message : 'Failed to fetch tokens' },
                };
            }
        },
        providesTags: (_, __, boardId) => [{ type: 'ApiToken' as const, id: boardId }],
    }),

    /**
     * Create a new API token for a board
     */
    createApiToken: builder.mutation<CreateTokenResponse, { boardId: string; input: CreateTokenInput }>({
        async queryFn({ boardId, input }) {
            try {
                const response = await fetch(`/api/board-settings/${boardId}/api-tokens`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(input),
                });

                if (!response.ok) {
                    const error = await response.json();
                    return { error: { message: error.error || 'Failed to create token' } };
                }

                const result: CreateApiTokenResponse = await response.json();
                return { data: result.data };
            } catch (error) {
                return {
                    error: { message: error instanceof Error ? error.message : 'Failed to create token' },
                };
            }
        },
        invalidatesTags: (_, __, { boardId }) => [{ type: 'ApiToken' as const, id: boardId }],
    }),

    /**
     * Update an API token
     */
    updateApiToken: builder.mutation<BoardApiTokenListItem, UpdateTokenInput>({
        async queryFn({ boardId, tokenId, ...updates }) {
            try {
                const response = await fetch(
                    `/api/board-settings/${boardId}/api-tokens?tokenId=${tokenId}`,
                    {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates),
                    }
                );

                if (!response.ok) {
                    const error = await response.json();
                    return { error: { message: error.error || 'Failed to update token' } };
                }

                const result = await response.json();
                return { data: result.data };
            } catch (error) {
                return {
                    error: { message: error instanceof Error ? error.message : 'Failed to update token' },
                };
            }
        },
        invalidatesTags: (_, __, { boardId }) => [{ type: 'ApiToken' as const, id: boardId }],
    }),

    /**
     * Revoke (soft delete) an API token
     */
    revokeApiToken: builder.mutation<{ success: boolean }, DeleteTokenInput>({
        async queryFn({ boardId, tokenId }) {
            try {
                const response = await fetch(
                    `/api/board-settings/${boardId}/api-tokens?tokenId=${tokenId}`,
                    {
                        method: 'DELETE',
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    const error = await response.json();
                    return { error: { message: error.error || 'Failed to revoke token' } };
                }

                return { data: { success: true } };
            } catch (error) {
                return {
                    error: { message: error instanceof Error ? error.message : 'Failed to revoke token' },
                };
            }
        },
        invalidatesTags: (_, __, { boardId }) => [{ type: 'ApiToken' as const, id: boardId }],
    }),
});
