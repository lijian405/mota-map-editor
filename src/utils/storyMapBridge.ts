import type { MapData } from '../types/map';

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

/** 当前选中格子的 "x,y"（含仅选中空格子）；无选中则 null */
export function getSelectedTileCoordString(
  mapData: MapData,
  selectedTileId: string | null,
  selectedGrid: { x: number; y: number } | null = null
): string | null {
  const floor = mapData.floors.find(f => f.floorId === mapData.currentFloor);
  if (!floor) return null;
  if (selectedTileId) {
    const tile = floor.tiles.find(t => t.id === selectedTileId);
    if (tile) return tileKey(tile.x, tile.y);
  }
  if (selectedGrid) return tileKey(selectedGrid.x, selectedGrid.y);
  return null;
}

/** 指定楼层上 NPC 瓦片的 name 字段（作 npc_id） */
export function getNpcNamesOnFloor(mapData: MapData, floorId: number): string[] {
  const floor = mapData.floors.find(f => f.floorId === floorId);
  if (!floor) return [];
  const set = new Set<string>();
  for (const t of floor.tiles) {
    if (t.type === 'npc' && typeof t.name === 'string' && t.name.trim()) {
      set.add(t.name.trim());
    }
  }
  return [...set].sort();
}

export function getFloorIds(mapData: MapData): number[] {
  return mapData.floors.map(f => f.floorId).sort((a, b) => a - b);
}
