import { Tile } from './tile';

export interface PlayerStart {
  x: number;
  y: number;
  hp: number;
  attack: number;
  defense: number;
  gold: number;
  yellowKeys: number;
  blueKeys: number;
  redKeys: number;
}

export interface StairsPosition {
  up: { x: number; y: number } | null;
  down: { x: number; y: number } | null;
}

export interface Floor {
  floorId: number;
  mapWidth: number;
  mapHeight: number;
  playerStart: PlayerStart;
  tiles: Tile[];
  stairs: StairsPosition;
}

export interface MapData {
  version: string;
  totalFloors: number;
  currentFloor: number;
  floors: Floor[];
}

export interface HistoryState {
  past: MapData[];
  present: MapData;
  future: MapData[];
}
