import { configureStore } from '@reduxjs/toolkit';
import boardReducer from './slices/boardSlice';

/**
 * Configures the Redux store with the board reducer.
 */
export const store = configureStore({
  reducer: {
    boards: boardReducer,
  },
});

/**
 * Type representing the root state of the Redux store.
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * Type representing the dispatch function of the Redux store.
 */
export type AppDispatch = typeof store.dispatch;