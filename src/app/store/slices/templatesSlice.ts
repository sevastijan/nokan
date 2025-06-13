import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BoardTemplate } from '../../lib/api';

type TemplatesState = {
  templates: BoardTemplate[];
  loading: boolean;
  error: string | null;
};

const initialState: TemplatesState = {
  templates: [],
  loading: false,
  error: null,
};

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    setTemplates: (state, action: PayloadAction<BoardTemplate[]>) => {
      state.templates = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state) => {
      state.loading = true;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { setTemplates, setLoading, setError } = templatesSlice.actions;
export default templatesSlice.reducer;