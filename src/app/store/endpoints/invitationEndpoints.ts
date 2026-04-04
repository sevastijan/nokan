/**
 * RTK Query endpoints for board invitations
 */

import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import type { BoardInvitation } from '@/app/types/globalTypes';

export const invitationEndpoints = (builder: EndpointBuilder<BaseQueryFn, string, string>) => ({
	sendBoardInvitation: builder.mutation<
		{ success: boolean; invitation: { id: string; token: string } },
		{ boardId: string; email: string; role?: string }
	>({
		async queryFn({ boardId, email, role }) {
			try {
				const response = await fetch('/api/invitations/send', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ boardId, email, role }),
				});

				const data = await response.json();

				if (!response.ok) {
					return { error: { status: response.status, data: data.error } };
				}

				return { data };
			} catch (err) {
				return { error: { status: 'FETCH_ERROR', data: String(err) } };
			}
		},
		invalidatesTags: (_result, _error, { boardId }) => [{ type: 'BoardInvitation', id: boardId }],
	}),

	getBoardInvitations: builder.query<BoardInvitation[], string>({
		async queryFn(boardId) {
			try {
				const response = await fetch(`/api/invitations/board?boardId=${boardId}`, {
					credentials: 'include',
				});

				const data = await response.json();

				if (!response.ok) {
					return { error: { status: response.status, data: data.error } };
				}

				return { data: data as BoardInvitation[] };
			} catch (err) {
				return { error: { status: 'FETCH_ERROR', data: String(err) } };
			}
		},
		providesTags: (_result, _error, boardId) => [{ type: 'BoardInvitation', id: boardId }],
	}),

	cancelBoardInvitation: builder.mutation<{ success: boolean }, { invitationId: string; boardId: string }>({
		async queryFn({ invitationId }) {
			try {
				const response = await fetch(`/api/invitations/board?invitationId=${invitationId}`, {
					method: 'DELETE',
					credentials: 'include',
				});

				const data = await response.json();

				if (!response.ok) {
					return { error: { status: response.status, data: data.error } };
				}

				return { data };
			} catch (err) {
				return { error: { status: 'FETCH_ERROR', data: String(err) } };
			}
		},
		invalidatesTags: (_result, _error, { boardId }) => [{ type: 'BoardInvitation', id: boardId }],
	}),
});
