/**
 * RTK Query endpoints for board invitations
 */

import { EndpointBuilder, BaseQueryFn } from '@reduxjs/toolkit/query';
import { getSupabase } from '@/app/lib/supabase';
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
				const { data, error } = await getSupabase()
					.from('board_invitations')
					.select('*')
					.eq('board_id', boardId)
					.eq('status', 'pending')
					.order('created_at', { ascending: false });

				if (error) {
					return { error: { status: 'CUSTOM_ERROR', error: error.message } };
				}

				return { data: (data ?? []) as BoardInvitation[] };
			} catch (err) {
				return { error: { status: 'CUSTOM_ERROR', error: String(err) } };
			}
		},
		providesTags: (_result, _error, boardId) => [{ type: 'BoardInvitation', id: boardId }],
	}),

	cancelBoardInvitation: builder.mutation<{ success: boolean }, { invitationId: string; boardId: string }>({
		async queryFn({ invitationId }) {
			try {
				const { error } = await getSupabase()
					.from('board_invitations')
					.update({ status: 'expired' })
					.eq('id', invitationId);

				if (error) {
					return { error: { status: 'CUSTOM_ERROR', error: error.message } };
				}

				return { data: { success: true } };
			} catch (err) {
				return { error: { status: 'CUSTOM_ERROR', error: String(err) } };
			}
		},
		invalidatesTags: (_result, _error, { boardId }) => [{ type: 'BoardInvitation', id: boardId }],
	}),
});
