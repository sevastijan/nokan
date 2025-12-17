import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskDetail } from '@/app/types/globalTypes';

interface TaskState {
     task: TaskDetail | null;
     loading: boolean;
     error: string | null;
     hasUnsavedChanges: boolean;
}

const initialState: TaskState = {
     task: null,
     loading: false,
     error: null,
     hasUnsavedChanges: false,
};

const taskSlice = createSlice({
     name: 'task',
     initialState,
     reducers: {
          setTask: (state, action: PayloadAction<TaskDetail | null>) => {
               state.task = action.payload;
               state.hasUnsavedChanges = false;
          },
          setLoading: (state, action: PayloadAction<boolean>) => {
               state.loading = action.payload;
          },
          setError: (state, action: PayloadAction<string | null>) => {
               state.error = action.payload;
          },
          markAsChanged: (state) => {
               state.hasUnsavedChanges = true;
               if (state.task) {
                    state.task.hasUnsavedChanges = true;
               }
          },
          markAsSaved: (state) => {
               state.hasUnsavedChanges = false;
               if (state.task) {
                    state.task.hasUnsavedChanges = false;
               }
          },
     },
});

export const { setTask, setLoading, setError, markAsChanged, markAsSaved } = taskSlice.actions;

export default taskSlice.reducer;
