import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type EditorTool = 'select' | 'paint' | 'erase' | 'fill';

export interface SelectedTileInfo {
  type: string;
  tileType: string;
  src: string;
}

interface EditorState {
  currentTool: EditorTool;
  zoom: number;
  panOffset: { x: number; y: number };
  showGrid: boolean;
  showMiniMap: boolean;
  isPanning: boolean;
  hoverPosition: { x: number; y: number } | null;
  selectedTileForPlacement: SelectedTileInfo | null;
  eventPanelOpen: boolean;
  previewOpen: boolean;
  tileEventPanelOpen: boolean;
  editingTileId: string | null;
  copiedTile: SelectedTileInfo | null;
}

const initialState: EditorState = {
  currentTool: 'paint',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  showGrid: true,
  showMiniMap: true,
  isPanning: false,
  hoverPosition: null,
  selectedTileForPlacement: null,
  eventPanelOpen: false,
  previewOpen: false,
  tileEventPanelOpen: false,
  editingTileId: null,
  copiedTile: null
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
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
    setEventPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.eventPanelOpen = action.payload;
    },
    setPreviewOpen: (state, action: PayloadAction<boolean>) => {
      state.previewOpen = action.payload;
    },
    setTileEventPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.tileEventPanelOpen = action.payload;
      if (!action.payload) {
        state.editingTileId = null;
      }
    },
    setEditingTileId: (state, action: PayloadAction<string | null>) => {
      state.editingTileId = action.payload;
    },
    setCopiedTile: (state, action: PayloadAction<SelectedTileInfo | null>) => {
      state.copiedTile = action.payload;
    }
  }
});

export const {
  setCurrentTool,
  setZoom,
  setPanOffset,
  toggleGrid,
  toggleMiniMap,
  setIsPanning,
  setHoverPosition,
  resetView,
  setSelectedTileForPlacement,
  setEventPanelOpen,
  setPreviewOpen,
  setTileEventPanelOpen,
  setEditingTileId,
  setCopiedTile
} = editorSlice.actions;

export default editorSlice.reducer;