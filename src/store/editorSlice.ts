import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type EditorTool = 'select' | 'paint' | 'erase' | 'fill';

export interface SelectedTileInfo {
  name: string;
  tileType: string;
  src: string;
}

export type EditorWorkspace = 'map' | 'story';

interface EditorState {
  workspace: EditorWorkspace;
  currentTool: EditorTool;
  zoom: number;
  panOffset: { x: number; y: number };
  showGrid: boolean;
  showMiniMap: boolean;
  isPanning: boolean;
  hoverPosition: { x: number; y: number } | null;
  selectedTileForPlacement: SelectedTileInfo | null;
  previewOpen: boolean;
  copiedTile: SelectedTileInfo | null;
}

const initialState: EditorState = {
  workspace: 'map',
  currentTool: 'paint',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: true,
  showMiniMap: true,
  isPanning: false,
  hoverPosition: null,
  selectedTileForPlacement: null,
  previewOpen: false,
  copiedTile: null
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    setWorkspace: (state, action: PayloadAction<EditorWorkspace>) => {
      state.workspace = action.payload;
    },
    setCurrentTool: (state, action: PayloadAction<EditorTool>) => {
      state.currentTool = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = Math.max(0.25, Math.min(4, action.payload));
    },
    setPanOffset: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.panOffset = action.payload;
    },
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },
    toggleMiniMap: (state) => {
      state.showMiniMap = !state.showMiniMap;
    },
    setIsPanning: (state, action: PayloadAction<boolean>) => {
      state.isPanning = action.payload;
    },
    setHoverPosition: (state, action: PayloadAction<{ x: number; y: number } | null>) => {
      state.hoverPosition = action.payload;
    },
    resetView: (state) => {
      state.zoom = 1;
      state.panOffset = { x: 0, y: 0 };
    },
    setSelectedTileForPlacement: (state, action: PayloadAction<SelectedTileInfo | null>) => {
      state.selectedTileForPlacement = action.payload;
    },
    setPreviewOpen: (state, action: PayloadAction<boolean>) => {
      state.previewOpen = action.payload;
    },
    setCopiedTile: (state, action: PayloadAction<SelectedTileInfo | null>) => {
      state.copiedTile = action.payload;
    }
  }
});

export const {
  setWorkspace,
  setCurrentTool,
  setZoom,
  setPanOffset,
  toggleGrid,
  toggleMiniMap,
  setIsPanning,
  setHoverPosition,
  resetView,
  setSelectedTileForPlacement,
  setPreviewOpen,
  setCopiedTile
} = editorSlice.actions;

export default editorSlice.reducer;
