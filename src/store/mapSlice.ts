import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MapData, Floor, Tile, PlayerStart, GameEvent, TileEvent } from '../types';
import { normalizeMapData } from '../utils/mapUtils';

const createEmptyFloor = (floorId: number, width: number = 12, height: number = 12): Floor => ({
  floorId,
  mapWidth: width,
  mapHeight: height,
  playerStart: { x: 1, y: 1, hp: 1000, attack: 10, defense: 10, gold: 0, yellowKeys: 0, blueKeys: 0, redKeys: 0 },
  tiles: [],
  stairs: { up: null, down: null },
  globalEvents: [],
  customEvents: []
});

const createEmptyMap = (): MapData => ({
  version: '1.0',
  totalFloors: 1,
  currentFloor: 1,
  floors: [createEmptyFloor(1)]
});

interface MapSliceState {
  mapData: MapData;
  selectedTileId: string | null;
  past: MapData[];
  future: MapData[];
  maxHistory: number;
}

const initialState: MapSliceState = {
  mapData: createEmptyMap(),
  selectedTileId: null,
  past: [],
  future: [],
  maxHistory: 20
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapData: (state, action: PayloadAction<MapData>) => {
      state.mapData = normalizeMapData(action.payload);
    },
    addFloor: (state, action: PayloadAction<{ width?: number; height?: number }>) => {
      const cur = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      const w = action.payload.width ?? cur?.mapWidth ?? 12;
      const h = action.payload.height ?? cur?.mapHeight ?? 12;
      const newFloorId = state.mapData.totalFloors + 1;
      state.mapData.floors.push(createEmptyFloor(newFloorId, w, h));
      state.mapData.totalFloors = newFloorId;
    },
    /** 按 floorId 删除一层；删除后重新编号为 1…n，并修正 currentFloor */
    removeFloor: (state, action: PayloadAction<number>) => {
      const floors = state.mapData.floors;
      if (floors.length <= 1) return;
      const delIdx = floors.findIndex(f => f.floorId === action.payload);
      if (delIdx === -1) return;

      const oldCurIdx = floors.findIndex(f => f.floorId === state.mapData.currentFloor);
      floors.splice(delIdx, 1);

      let newIdx: number;
      if (oldCurIdx === delIdx) {
        newIdx = Math.min(delIdx, floors.length - 1);
      } else if (oldCurIdx > delIdx) {
        newIdx = oldCurIdx - 1;
      } else {
        newIdx = oldCurIdx;
      }

      floors.forEach((f, i) => {
        f.floorId = i + 1;
      });
      state.mapData.totalFloors = floors.length;
      state.mapData.currentFloor = newIdx + 1;
      state.selectedTileId = null;
    },
    switchFloor: (state, action: PayloadAction<number>) => {
      if (action.payload >= 1 && action.payload <= state.mapData.totalFloors) {
        state.mapData.currentFloor = action.payload;
        state.selectedTileId = null;
      }
    },
    addTile: (state, action: PayloadAction<Tile>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        const existingIndex = floor.tiles.findIndex(t => t.x === action.payload.x && t.y === action.payload.y);
        if (existingIndex !== -1) {
          floor.tiles[existingIndex] = action.payload;
        } else {
          floor.tiles.push(action.payload);
        }
      }
    },
    removeTile: (state, action: PayloadAction<{ x: number; y: number }>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        floor.tiles = floor.tiles.filter(t => !(t.x === action.payload.x && t.y === action.payload.y));
      }
    },
    updateTile: (state, action: PayloadAction<Tile>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        const index = floor.tiles.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          floor.tiles[index] = action.payload;
        }
      }
    },
    setSelectedTileId: (state, action: PayloadAction<string | null>) => {
      state.selectedTileId = action.payload;
    },
    updatePlayerStart: (state, action: PayloadAction<PlayerStart>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        floor.playerStart = action.payload;
      }
    },
    updateStairs: (state, action: PayloadAction<{ position: 'up' | 'down'; coords: { x: number; y: number } | null }>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        floor.stairs[action.payload.position] = action.payload.coords;
      }
    },
    updateMapSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        floor.mapWidth = action.payload.width;
        floor.mapHeight = action.payload.height;
      }
    },
    clearMap: (state) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        floor.tiles = [];
      }
    },
    addGlobalEvent: (state, action: PayloadAction<GameEvent>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        const existingIndex = floor.globalEvents.findIndex(e => e.eventId === action.payload.eventId);
        if (existingIndex >= 0) {
          floor.globalEvents[existingIndex] = action.payload;
        } else {
          floor.globalEvents.push(action.payload);
        }
      }
    },
    removeGlobalEvent: (state, action: PayloadAction<string>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        floor.globalEvents = floor.globalEvents.filter(e => e.eventId !== action.payload);
      }
    },
    addCustomEvent: (state, action: PayloadAction<GameEvent>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        const existingIndex = floor.customEvents.findIndex(e => e.eventId === action.payload.eventId);
        if (existingIndex >= 0) {
          floor.customEvents[existingIndex] = action.payload;
        } else {
          floor.customEvents.push(action.payload);
        }
      }
    },
    removeCustomEvent: (state, action: PayloadAction<string>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (floor) {
        floor.customEvents = floor.customEvents.filter(e => e.eventId !== action.payload);
      }
    },
    addTileEvent: (state, action: PayloadAction<{ tileId: string; event: TileEvent }>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (!floor) return;
      const tile = floor.tiles.find(t => t.id === action.payload.tileId);
      if (!tile) return;
      const idx = tile.events.findIndex(e => e.eventId === action.payload.event.eventId);
      if (idx >= 0) {
        tile.events[idx] = action.payload.event;
      } else {
        tile.events.push(action.payload.event);
      }
    },
    removeTileEvent: (state, action: PayloadAction<{ tileId: string; eventId: string }>) => {
      const floor = state.mapData.floors.find(f => f.floorId === state.mapData.currentFloor);
      if (!floor) return;
      const tile = floor.tiles.find(t => t.id === action.payload.tileId);
      if (tile) {
        tile.events = tile.events.filter(e => e.eventId !== action.payload.eventId);
      }
    },
    undo: (state) => {
      if (state.past.length === 0) return;
      const previous = state.past.pop()!;
      state.future.unshift(state.mapData);
      state.mapData = previous;
    },
    redo: (state) => {
      if (state.future.length === 0) return;
      const next = state.future.shift()!;
      state.past.push(state.mapData);
      state.mapData = next;
    },
    saveHistory: (state) => {
      state.past.push(JSON.parse(JSON.stringify(state.mapData)));
      if (state.past.length > state.maxHistory) {
        state.past.shift();
      }
      state.future = [];
    }
  }
});

export const {
  setMapData,
  addFloor,
  removeFloor,
  switchFloor,
  addTile,
  removeTile,
  updateTile,
  setSelectedTileId,
  updatePlayerStart,
  updateStairs,
  updateMapSize,
  clearMap,
  addGlobalEvent,
  removeGlobalEvent,
  addCustomEvent,
  removeCustomEvent,
  addTileEvent,
  removeTileEvent,
  undo,
  redo,
  saveHistory
} = mapSlice.actions;

export default mapSlice.reducer;