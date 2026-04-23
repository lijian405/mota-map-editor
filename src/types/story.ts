/** 与 docs/剧情编辑器开发说明.md 对齐；额外字段用 Record 保留 */

export type TriggerType = 'floor_enter' | 'tile_enter' | 'npc_interact' | 'monsters_defeated';

export interface TriggerFloorEnter {
  type: 'floor_enter';
  floor: number;
}

export interface TriggerTileEnter {
  type: 'tile_enter';
  floor: number;
  tile: string;
}

export interface TriggerNpcInteract {
  type: 'npc_interact';
  npc: string;
  floor?: number;
}

export type MonsterPosition = string | { x: number; y: number } | number;

export interface TriggerMonstersDefeated {
  type: 'monsters_defeated';
  floor: number;
  positions?: MonsterPosition[];
  tiles?: MonsterPosition[];
  match?: 'all' | 'any';
  monsterIds?: string[];
}

export type StoryTrigger =
  | TriggerFloorEnter
  | TriggerTileEnter
  | TriggerNpcInteract
  | TriggerMonstersDefeated;

export type ChatContentLine =
  | string
  | ({
      name?: string;
      content?: string | string[];
      choices?: { label: string; actions: StoryAction[] }[];
    } & Record<string, unknown>);

export type ImplementedActionType =
  | 'chat'
  | 'playSound'
  | 'screenFade'
  | 'appear'
  | 'move'
  | 'removeTile'
  | 'changeFloor'
  | 'changePlayerState'
  | 'giveItem'
  | 'runEvent';

export type PlaceholderActionType = 'playTileAnimation' | 'spawnTile' | 'spwanTile';

export type StoryActionType = ImplementedActionType | PlaceholderActionType;

export type AppearEntityType = 'player' | 'npc' | 'monster' | 'item';

export type StoryPos = string | number | { x: number; y: number };

export interface AppearEntity {
  type: AppearEntityType;
  pos?: StoryPos;
  name?: string;
  delay?: number;
}

export type StoryAction = {
  type: StoryActionType;
  delay?: number;
} & Record<string, unknown>;

export interface Story {
  id: string | number;
  desc?: string;
  repeatable?: boolean;
  order?: number;
  trigger: StoryTrigger;
  actions: StoryAction[];
}

/** 编辑器专用：画布节点坐标；游戏运行时忽略 */
export interface StoryGraphLayout {
  version: 1;
  positions: Record<string, { x: number; y: number }>;
}

export interface StoryRoot {
  stories: Story[];
  _storyGraph?: StoryGraphLayout;
}

export const PLACEHOLDER_ACTION_TYPES: PlaceholderActionType[] = [
  'playTileAnimation',
  'spawnTile',
  'spwanTile'
];

export function isPlaceholderActionType(t: string): t is PlaceholderActionType {
  return (PLACEHOLDER_ACTION_TYPES as string[]).includes(t);
}
