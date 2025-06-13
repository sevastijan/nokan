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
    setAvatar: (state, action: PayloadAction<{ key: string; url: string }>) => {
      state.cache[action.payload.key] = action.payload.url;
    },
  },
});

export const { setAvatar } = avatarSlice.actions;
export default avatarSlice.reducer;
