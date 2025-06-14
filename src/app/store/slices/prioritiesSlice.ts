import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Priority } from "@/app/components/SingleTaskView/types";

type PrioritiesState = {
  priorities: Priority[];
  loading: boolean;
  error: string | null;
};

const initialState: PrioritiesState = {
  priorities: [],
  loading: false,
  error: null,
};

const prioritiesSlice = createSlice({
  name: "priorities",
  initialState,
  reducers: {
    setPriorities: (state, action: PayloadAction<Priority[]>) => {
      state.priorities = action.payload;
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

export const { setPriorities, setLoading, setError } = prioritiesSlice.actions;
export default prioritiesSlice.reducer;
