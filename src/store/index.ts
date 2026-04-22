import { configureStore } from '@reduxjs/toolkit';
import mapReducer from './mapSlice';
import editorReducer from './editorSlice';
import historyReducer from './historySlice';
import storyReducer from './storySlice';

export const store = configureStore({
  reducer: {
    map: mapReducer,
    editor: editorReducer,
    history: historyReducer,
    story: storyReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;