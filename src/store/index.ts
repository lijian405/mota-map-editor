import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './mapSlice';
import editorReducer from './editorSlice';
import historyReducer from './historySlice';

export const store = configureStore({
  reducer: {
    map: mapReducer,
    editor: editorReducer,
    history: historyReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;