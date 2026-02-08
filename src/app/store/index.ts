import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './apiSlice';
import { calendarApi } from './slices/calendarApiSlice';
import chatUiReducer from './slices/chatUiSlice';

const store = configureStore({
     reducer: {
          [apiSlice.reducerPath]: apiSlice.reducer,
          [calendarApi.reducerPath]: calendarApi.reducer,
          chatUi: chatUiReducer,
     },
     middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware, calendarApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
