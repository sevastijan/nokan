'use client';

import { useCallback, ReactNode } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
	selectSelectedChannelId,
	selectThreadParentId,
	selectMiniChats,
	selectChannel as selectChannelAction,
	openThread as openThreadAction,
	closeThread as closeThreadAction,
	openMiniChat as openMiniChatAction,
	closeMiniChat as closeMiniChatAction,
	toggleMinimizeMiniChat as toggleMinimizeAction,
} from '@/app/store/slices/chatUiSlice';
import type { MiniChatWindow } from '@/app/store/slices/chatUiSlice';
import type { AppDispatch } from '@/app/store/index';

export type { MiniChatWindow };

export function useChat() {
	const dispatch = useDispatch<AppDispatch>();
	const selectedChannelId = useSelector(selectSelectedChannelId);
	const threadParentId = useSelector(selectThreadParentId);
	const miniChats = useSelector(selectMiniChats);

	const selectChannel = useCallback(
		(channelId: string | null) => dispatch(selectChannelAction(channelId)),
		[dispatch]
	);

	const openThread = useCallback(
		(parentId: string) => dispatch(openThreadAction(parentId)),
		[dispatch]
	);

	const closeThread = useCallback(() => dispatch(closeThreadAction()), [dispatch]);

	const openMiniChat = useCallback(
		(channelId: string) => dispatch(openMiniChatAction(channelId)),
		[dispatch]
	);

	const closeMiniChat = useCallback(
		(channelId: string) => dispatch(closeMiniChatAction(channelId)),
		[dispatch]
	);

	const toggleMinimizeMiniChat = useCallback(
		(channelId: string) => dispatch(toggleMinimizeAction(channelId)),
		[dispatch]
	);

	return {
		selectedChannelId,
		threadParentId,
		miniChats,
		selectChannel,
		openThread,
		closeThread,
		openMiniChat,
		closeMiniChat,
		toggleMinimizeMiniChat,
	};
}

/** ChatProvider is now a passthrough — Redux store handles state */
export function ChatProvider({ children }: { children: ReactNode }) {
	return <>{children}</>;
}
