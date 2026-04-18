import { saveAs } from 'file-saver';
import { MapData, Tile, TileType } from '../types';
import { presetTiles } from '../data/presetTiles';

/** 与导出/运行时约定一致：地形为 terrain，其余为 object */
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

/** preset 的 tileType → 导出/面板用大类（门 → gate） */
export function tileKindFromPresetTileType(tileType: TileType): string {
  if (tileType === 'door') return 'gate';
  if (tileType === 'mechanism') return 'terrain';
  return tileType;
}

function normalizeTileRaw(raw: Tile): Tile {
  const x = Number(raw.x);
  const y = Number(raw.y);
  const id = typeof raw.id === 'string' ? raw.id : `tile_${x}_${y}`;
  const properties = raw.properties && typeof raw.properties === 'object' ? raw.properties : {};
  const events = Array.isArray(raw.events) ? raw.events : [];

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
      name = preset.type;
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
        properties,
        events
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
      properties,
      events
    };
  }

  const tileType = (preset.tileType as TileType) || (raw.tileType as TileType) || 'terrain';
  return {
    id,
    x,
    y,
    type: kind,
    name: preset.type,
    tileType,
    layer: inferTileLayer({ layer: raw.layer, tileType }),
    src: raw.src ?? preset.src,
    properties,
    events
  };
}

/** 同一格只保留最后一个瓦片（与导出 fill逻辑一致） */
export function dedupeTilesByCell(tiles: Tile[]): Tile[] {
  const byKey = new Map<string, Tile>();
  for (const t of tiles) {
    byKey.set(`${t.x},${t.y}`, t);
  }
  return Array.from(byKey.values());
}

/** 历史「整图填充」生成的瓦片（导出时曾写入 border_x_y / 内圈 floor_x_y） */
export function isSyntheticFillTile(t: Tile): boolean {
  if (t.name === 'floor' && /^floor_\d+_\d+$/.test(t.id)) return true;
  if (t.name === 'wall' && /^border_\d+_\d+$/.test(t.id)) return true;
  return false;
}

/**
 * 剔除合成填充格。手动放置的地板 id 通常含时间戳，不会误删。
 */
export function stripSyntheticFillTiles(tiles: Tile[]): Tile[] {
  return tiles.filter(t => !isSyntheticFillTile(t));
}

/** 打开 JSON 后规范化：去重格子、补全 layer / events、去掉合成填充格 */
export function normalizeMapData(data: MapData): MapData {
  return {
    ...data,
    floors: data.floors.map(floor => ({
      ...floor,
      tiles: stripSyntheticFillTiles(dedupeTilesByCell((floor.tiles ?? []).map(normalizeTileRaw)))
    }))
  };
}

/** 仅导出编辑中的瓦片，不整图填充墙/地板 */
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
    currentFloor: 1,
    floors: [{
      floorId: 1,
      mapWidth: 20,
      mapHeight: 15,
      playerStart: { x: 2, y: 2, hp: 1000, attack: 10, defense: 10, gold: 0, yellowKeys: 1, blueKeys: 0, redKeys: 0 },
      tiles: [],
      stairs: { up: null, down: null },
      globalEvents: [],
      customEvents: []
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
          properties: {},
          events: []
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
          properties: {},
          events: []
        });
      }
    }
  }

  sampleMap.floors[0].stairs.down = { x: 2, y: 2 };
  sampleMap.floors[0].stairs.up = { x: 18, y: 13 };

  exportMapToJson(sampleMap, 'sample_map.json');
};