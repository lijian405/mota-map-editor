export type TileType = 'terrain' | 'item' | 'monster' | 'npc' | 'door' | 'mechanism';

export type TerrainType = 'wall' | 'floor' | 'stairs_up' | 'stairs_down' | 'portal' | 'airWall' | 'lava' | 'rail' | 'shopLeft' | 'shopCenter' | 'shopRight';
export type ItemType = 'yellowkey' | 'bluekey' | 'redkey' | 'attackgem' | 'defencegem' | 'hp' | 'hplarge' | 'luckycoins' | 'magickey' | 'chuansong' | 'notepad' | 'tiejian' | 'tiedun' | 'yinjian' | 'yindun' | 'qishijian' | 'qishidun' | 'shengjian' | 'shengdun' | 'shenshengjian' | 'shenshengdun';
export type MonsterType = string;
export type NpcType = 'thief' | 'wise' | 'business';
export type DoorType = 'yellowgate' | 'bluegate' | 'redgate' | 'greengate';

export interface Tile {
  id: string;
  x: number;
  y: number;
  /**
   * 大类，与导出 JSON 一致：terrain | gate | item | monster | npc（门为 gate，非 door）
   */
  type: string;
  /**
   * Tile 库预设标识，与 presetTiles[].type 一致，如 yellowgate、monster12、wall
   */
  name: string;
  tileType: TileType;
  layer: 'terrain' | 'object' | 'event';
  src?: string;
  properties: TileProperties;
}

export interface TileProperties {
  name?: string;
  hp?: number;
  attack?: number;
  defense?: number;
  exp?: number;
  gold?: number;
  dialog?: string;
  keyType?: 'yellow' | 'blue' | 'red' | 'green';
  eventIds?: string[];
}

export interface PresetTile {
  name: string;
  type: string;
  tileType: TileType;
  layer: 'terrain' | 'object' | 'event';
  src: string;
}
