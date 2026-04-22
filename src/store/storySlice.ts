import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Story, StoryRoot } from '../types/story';
import {
  graphPositionsAfterDuplicateStory,
  graphPositionsAfterRemoveStory,
  permutationAfterMove,
  remapStoryGraphPositions,
  type StoryFlowFocus
} from '../utils/storyFlowAdapter';

export interface StorySliceState {
  document: StoryRoot | null;
  fileName: string | null;
  dirty: boolean;
  selectedIndex: number | null;
  /** 画布与表单联动：触发器或某一动作 */
  selectedFlowFocus: StoryFlowFocus;
}

const initialState: StorySliceState = {
  document: null,
  fileName: null,
  dirty: false,
  selectedIndex: null,
  selectedFlowFocus: null
};

const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    setStoryDocument: (
      state,
      action: PayloadAction<{ document: StoryRoot; fileName?: string | null; dirty?: boolean }>
    ) => {
      state.document = action.payload.document;
      if (action.payload.fileName !== undefined) {
        state.fileName = action.payload.fileName;
      }
      state.dirty = action.payload.dirty ?? false;
      const n = action.payload.document.stories.length;
      state.selectedIndex = n > 0 ? Math.min(state.selectedIndex ?? 0, n - 1) : null;
      state.selectedFlowFocus = null;
    },
    setStoryDirty: (state, action: PayloadAction<boolean>) => {
      state.dirty = action.payload;
    },
    setSelectedStoryIndex: (state, action: PayloadAction<number | null>) => {
      state.selectedIndex = action.payload;
      state.selectedFlowFocus = null;
    },
    setSelectedFlowFocus: (state, action: PayloadAction<StoryFlowFocus>) => {
      state.selectedFlowFocus = action.payload;
    },
    updateStoryGraphPositions: (
      state,
      action: PayloadAction<Record<string, { x: number; y: number }>>
    ) => {
      if (!state.document) return;
      const prev = state.document._storyGraph?.positions ?? {};
      state.document._storyGraph = {
        version: 1,
        positions: { ...prev, ...action.payload }
      };
      state.dirty = true;
    },
    updateStoryAt: (state, action: PayloadAction<{ index: number; story: Story }>) => {
      if (!state.document) return;
      const { index, story } = action.payload;
      if (index < 0 || index >= state.document.stories.length) return;
      state.document.stories[index] = story;
      state.dirty = true;
    },
    addStory: (state, action: PayloadAction<Story>) => {
      if (!state.document) {
        state.document = { stories: [] };
      }
      state.document.stories.push(action.payload);
      state.selectedIndex = state.document.stories.length - 1;
      state.dirty = true;
    },
    removeStoryAt: (state, action: PayloadAction<number>) => {
      if (!state.document) return;
      const i = action.payload;
      if (i < 0 || i >= state.document.stories.length) return;
      const len = state.document.stories.length;
      const pos = state.document._storyGraph?.positions ?? {};
      state.document.stories.splice(i, 1);
      state.document._storyGraph = {
        version: 1,
        positions: graphPositionsAfterRemoveStory(pos, i, len)
      };
      if (state.document.stories.length === 0) {
        state.selectedIndex = null;
      } else if (state.selectedIndex !== null) {
        state.selectedIndex = Math.min(state.selectedIndex, state.document.stories.length - 1);
      }
      state.selectedFlowFocus = null;
      state.dirty = true;
    },
    duplicateStoryAt: (state, action: PayloadAction<number>) => {
      if (!state.document) return;
      const i = action.payload;
      if (i < 0 || i >= state.document.stories.length) return;
      const lenBefore = state.document.stories.length;
      const pos = state.document._storyGraph?.positions ?? {};
      const copy = JSON.parse(JSON.stringify(state.document.stories[i])) as Story;
      copy.id = `${copy.id}_copy_${Date.now()}`;
      state.document.stories.splice(i + 1, 0, copy);
      state.document._storyGraph = {
        version: 1,
        positions: graphPositionsAfterDuplicateStory(pos, i, lenBefore)
      };
      state.selectedIndex = i + 1;
      state.selectedFlowFocus = null;
      state.dirty = true;
    },
    moveStory: (state, action: PayloadAction<{ from: number; to: number }>) => {
      if (!state.document) return;
      const { from, to } = action.payload;
      if (from < 0 || from >= state.document.stories.length) return;
      const t = Math.max(0, Math.min(to, state.document.stories.length - 1));
      if (from === t) return;
      const len = state.document.stories.length;
      const pos = state.document._storyGraph?.positions ?? {};
      const [item] = state.document.stories.splice(from, 1);
      state.document.stories.splice(t, 0, item);
      const perm = permutationAfterMove(from, t, len);
      state.document._storyGraph = {
        version: 1,
        positions: remapStoryGraphPositions(pos, perm)
      };
      state.selectedIndex = t;
      state.selectedFlowFocus = null;
      state.dirty = true;
    },
    clearStoryDocument: (state) => {
      state.document = null;
      state.fileName = null;
      state.dirty = false;
      state.selectedIndex = null;
      state.selectedFlowFocus = null;
    }
  }
});

export const {
  setStoryDocument,
  setStoryDirty,
  setSelectedStoryIndex,
  setSelectedFlowFocus,
  updateStoryGraphPositions,
  updateStoryAt,
  addStory,
  removeStoryAt,
  duplicateStoryAt,
  moveStory,
  clearStoryDocument
} = storySlice.actions;

export default storySlice.reducer;
