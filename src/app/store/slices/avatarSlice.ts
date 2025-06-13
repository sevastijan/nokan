import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AvatarState {
  cache: Record<string, string>;
}

const initialState: AvatarState = {
  cache: {},
};

const avatarSlice = createSlice({
  name: "avatars",
  initialState,
  reducers: {
    // Stores avatar URL in cache under given key
    setAvatar: (state, action: PayloadAction<{ key: string; url: string }>) => {
      state.cache[action.payload.key] = action.payload.url;
    },
    // Removes a single avatar entry from cache
    removeAvatar: (state, action: PayloadAction<string>) => {
      delete state.cache[action.payload];
    },
    // Clears entire cache
    clearAvatars: (state) => {
      state.cache = {};
    },
  },
});

export const { setAvatar, removeAvatar, clearAvatars } = avatarSlice.actions;
export default avatarSlice.reducer;
