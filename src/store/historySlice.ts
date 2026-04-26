import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapData } from '../types';

interface HistoryState {
  past: MapData[];
  present: MapData;
  future: MapData[];
  maxHistory: number;
}

const createEmptyMap = (): MapData => ({
  version: '1.0',
  totalFloors: 1,
  currentFloor: 0,
  floors: []
});

const initialState: HistoryState = {
  past: [],
  present: createEmptyMap(),
  future: [],
  maxHistory: 20
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    initHistory: (state, action: PayloadAction<MapData>) => {
      state.past = [];
      state.present = action.payload;
      state.future = [];
    },
    pushHistory: (state, action: PayloadAction<MapData>) => {
      if (JSON.stringify(state.present) === JSON.stringify(action.payload)) return;
      state.past.push(state.present);
      if (state.past.length > state.maxHistory) {
        state.past.shift();
      }
      state.present = action.payload;
      state.future = [];
    },
    undo: (state) => {
      if (state.past.length === 0) return;
      const previous = state.past.pop()!;
      state.future.unshift(state.present);
      state.present = previous;
    },
    redo: (state) => {
      if (state.future.length === 0) return;
      const next = state.future.shift()!;
      state.past.push(state.present);
      state.present = next;
    },
    setPresent: (state, action: PayloadAction<MapData>) => {
      state.present = action.payload;
    }
  }
});

export const { initHistory, pushHistory, undo, redo, setPresent } = historySlice.actions;
export default historySlice.reducer;
