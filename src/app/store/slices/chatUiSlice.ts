import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface MiniChatWindow {
	channelId: string;
	minimized: boolean;
}

interface ChatUiState {
	selectedChannelId: string | null;
	threadParentId: string | null;
	miniChats: MiniChatWindow[];
}

const initialState: ChatUiState = {
	selectedChannelId: null,
	threadParentId: null,
	miniChats: [],
};

const chatUiSlice = createSlice({
	name: 'chatUi',
	initialState,
	reducers: {
		selectChannel(state, action: PayloadAction<string | null>) {
			state.selectedChannelId = action.payload;
			state.threadParentId = null;
		},
		openThread(state, action: PayloadAction<string>) {
			state.threadParentId = action.payload;
		},
		closeThread(state) {
			state.threadParentId = null;
		},
		openMiniChat(state, action: PayloadAction<string>) {
			const channelId = action.payload;
			const exists = state.miniChats.find((mc) => mc.channelId === channelId);
			if (exists) {
				state.miniChats = state.miniChats.map((mc) =>
					mc.channelId === channelId ? { ...mc, minimized: false } : mc
				);
			} else {
				state.miniChats = [...state.miniChats, { channelId, minimized: false }].slice(-3);
			}
		},
		closeMiniChat(state, action: PayloadAction<string>) {
			state.miniChats = state.miniChats.filter((mc) => mc.channelId !== action.payload);
		},
		toggleMinimizeMiniChat(state, action: PayloadAction<string>) {
			state.miniChats = state.miniChats.map((mc) =>
				mc.channelId === action.payload ? { ...mc, minimized: !mc.minimized } : mc
			);
		},
	},
});

export const {
	selectChannel,
	openThread,
	closeThread,
	openMiniChat,
	closeMiniChat,
	toggleMinimizeMiniChat,
} = chatUiSlice.actions;

// Selectors
export const selectSelectedChannelId = (state: RootState) => state.chatUi.selectedChannelId;
export const selectThreadParentId = (state: RootState) => state.chatUi.threadParentId;
export const selectMiniChats = (state: RootState) => state.chatUi.miniChats;

export default chatUiSlice.reducer;
