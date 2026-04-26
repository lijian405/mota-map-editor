import { saveAs } from 'file-saver';
import { MapData, Tile, TileType, FootprintOrigin } from '../types';
import { presetTiles } from '../data/presetTiles';

function parseFootprintFromRaw(raw: Record<string, unknown>): Partial<Pick<Tile, 'footprintW' | 'footprintH' | 'footprintOrigin'>> {
  const w = raw['footprintW'] ?? raw['footprint_w'];
  const h = raw['footprintH'] ?? raw['footprint_h'];
  const o = raw['footprintOrigin'] ?? raw['footprint_origin'];
  const out: Partial<Pick<Tile, 'footprintW' | 'footprintH' | 'footprintOrigin'>> = {};
  const asPositiveInt = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 1) return Math.max(1, Math.floor(v));
    if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
      const n = parseInt(v.trim(), 10);
      if (n >= 1) return n;
    }
    return undefined;
  };
  const fw = asPositiveInt(w);
  const fh = asPositiveInt(h);
  if (fw !== undefined) out.footprintW = fw;
  if (fh !== undefined) out.footprintH = fh;
  if (typeof o === 'string') {
    const n = o.trim().toLowerCase();
    if (n === 'topleft' || n === 'center' || n === 'heart') {
      out.footprintOrigin = n as FootprintOrigin;
    }
  }
  return out;
}

export const tileLayerFromTileType = (tileType: string): Tile['layer'] =>
  tileType === 'terrain' ? 'terrain' : 'object';

function inferTileLayer(tile: Pick<Tile, 'layer' | 'tileType'>): Tile['layer'] {
  const L = tile.layer;
  if (L === 'terrain' || L === 'object' || L === 'event') return L;
  return tileLayerFromTileType(tile.tileType ?? 'terrain');
}

const TILE_KINDS = ['terrain', 'gate', 'item', 'monster', 'npc'] as const;

function isTileKind(s: string): s is (typeof TILE_KINDS)[number] {
  return (TILE_KINDS as readonly string[]).includes(s);
}

export function tileKindFromPresetTileType(tileType: TileType): string {
  if (tileType === 'door') return 'gate';
  if (tileType === 'mechanism') return 'terrain';
  return tileType;
}

function normalizeTileRaw(raw: Tile): Tile {
  if(raw.type === 'monster') {
    console.log(raw.name);
  }
  const x = Number(raw.x);
  const y = Number(raw.y);
  const id = typeof raw.id === 'string' ? raw.id : `tile_${x}_${y}`;
  const properties = raw.properties && typeof raw.properties === 'object' ? raw.properties : {};
  const footprint = parseFootprintFromRaw(raw as unknown as Record<string, unknown>);

  let nameField = typeof raw.name === 'string' ? raw.name : '';
  if (nameField === 'greenGate') nameField = 'greengate';

  let rawKind = typeof raw.type === 'string' ? raw.type : 'terrain';
  if (rawKind === 'door') rawKind = 'gate';

  const hasNewShape = nameField !== '' && isTileKind(rawKind);
  let preset = undefined as (typeof presetTiles)[0] | undefined;
  let kind: string;
  let name: string;

  if (hasNewShape) {
    name = nameField;
    kind = rawKind;
    preset = presetTiles.find(p => p.type === name || p.name === name);
  } else {
    const legacyKey = nameField || rawKind;
    preset = presetTiles.find(p => p.type === legacyKey || p.name === legacyKey);
    if (preset) {
      name = preset.name;
      kind = tileKindFromPresetTileType(preset.tileType as TileType);
    } else {
      name = nameField || legacyKey;
      kind = isTileKind(rawKind) ? rawKind : 'terrain';
      const tileType = (raw.tileType as TileType) || 'terrain';

      return {
        id,
        x,
        y,
        type: kind,
        name,
        tileType,
        layer: inferTileLayer({ layer: raw.layer, tileType }),
        src: raw.src,
        ...footprint,
        properties
      };
    }
  }

  if (!preset) {
    const tileType = (raw.tileType as TileType) || 'terrain';
    return {
      id,
      x,
      y,
      type: kind,
      name: nameField || rawKind,
      tileType,
      layer: inferTileLayer({ layer: raw.layer, tileType }),
      src: raw.src,
      ...footprint,
      properties
    };
  }

  const tileType = (preset.tileType as TileType) || (raw.tileType as TileType) || 'terrain';
  return {
    id,
    x,
    y,
    type: kind,
    name: preset.name,
    tileType,
    layer: inferTileLayer({ layer: raw.layer, tileType }),
    src: raw.src ?? preset.src,
    ...footprint,
    properties
  };
}

export function dedupeTilesByCell(tiles: Tile[]): Tile[] {
  const byKey = new Map<string, Tile>();
  for (const t of tiles) {
    byKey.set(`${t.x},${t.y}`, t);
  }
  return Array.from(byKey.values());
}

export function isSyntheticFillTile(t: Tile): boolean {
  if (t.name === 'floor' && /^floor_\d+_\d+$/.test(t.id)) return true;
  if (t.name === 'wall' && /^border_\d+_\d+$/.test(t.id)) return true;
  return false;
}

export function stripSyntheticFillTiles(tiles: Tile[]): Tile[] {
  return tiles.filter(t => !isSyntheticFillTile(t));
}

export function normalizeMapData(data: MapData): MapData {
  return {
    ...data,
    floors: data.floors.map(floor => ({
      ...floor,
      tiles: stripSyntheticFillTiles(dedupeTilesByCell((floor.tiles ?? []).map(normalizeTileRaw)))
    }))
  };
}

export const exportMapToJson = (mapData: MapData, filename: string = 'map.json'): void => {
  const exportData: MapData = {
    ...mapData,
    floors: mapData.floors.map(floor => ({
      ...floor,
      tiles: dedupeTilesByCell(floor.tiles ?? [])
    }))
  };
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  saveAs(blob, filename);
};

export const importMapFromJson = (file: File): Promise<MapData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as MapData;
        if (!validateMapData(data)) {
          reject(new Error('无效的地图数据格式'));
          return;
        }
        resolve(normalizeMapData(data));
      } catch (error) {
        reject(new Error('解析 JSON 文件失败'));
      }
    };
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    reader.readAsText(file);
  });
};

const validateMapData = (data: unknown): data is MapData => {
  if (!data || typeof data !== 'object') return false;
  const map = data as Record<string, unknown>;
  if (typeof map.version !== 'string') return false;
  if (typeof map.totalFloors !== 'number') return false;
  if (typeof map.currentFloor !== 'number') return false;
  if (!Array.isArray(map.floors)) return false;
  return true;
};

export const downloadSampleMap = (): void => {
  const sampleMap: MapData = {
    version: '1.0',
    totalFloors: 1,
    currentFloor: 0,
    floors: [{
      floorId: 0,
      mapWidth: 20,
      mapHeight: 15,
      playerStart: { x: 2, y: 2, hp: 1000, attack: 10, defense: 10, gold: 0, yellowKeys: 1, blueKeys: 0, redKeys: 0 },
      tiles: [],
      stairs: { up: null, down: null }
    }]
  };

  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 15; y++) {
      if (x === 0 || x === 19 || y === 0 || y === 14) {
        sampleMap.floors[0].tiles.push({
          id: `wall_${x}_${y}`,
          x,
          y,
          type: 'terrain',
          name: 'wall',
          tileType: 'terrain',
          layer: 'terrain',
          properties: {}
        });
      } else if (y === 2 && x > 2 && x < 7) {
        sampleMap.floors[0].tiles.push({
          id: `sample_floor_${x}_${y}`,
          x,
          y,
          type: 'terrain',
          name: 'floor',
          tileType: 'terrain',
          layer: 'terrain',
          properties: {}
        });
      }
    }
  }

  sampleMap.floors[0].stairs.down = { x: 2, y: 2 };
  sampleMap.floors[0].stairs.up = { x: 18, y: 13 };

  exportMapToJson(sampleMap, 'sample_map.json');
};
