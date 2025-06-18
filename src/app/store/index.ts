// store.ts
import { configureStore } from "@reduxjs/toolkit";
import taskReducer from "./slices/taskSlice";
import boardReducer from "./slices/boardSlice";
import prioritiesReducer from "./slices/prioritiesSlice";
import templatesReducer from "./slices/templatesSlice";
import avatarReducer from "./slices/avatarSlice";
import { apiSlice } from "./apiSlice";
import { calendarApi } from "./slices/calendarApiSlice";

const store = configureStore({
  reducer: {
    task: taskReducer,
    board: boardReducer,
    priorities: prioritiesReducer,
    templates: templatesReducer,
    avatars: avatarReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware, calendarApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
