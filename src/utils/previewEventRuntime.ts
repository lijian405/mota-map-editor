import { presetTiles } from '../data/presetTiles';
import type { MapData, Tile, TileType } from '../types';
import { tileKindFromPresetTileType, tileLayerFromTileType } from './mapUtils';
import type { Action, Condition, ConditionLogic, GameEvent, TriggerType } from '../types/event';
import type { TileEvent } from '../types/tile';

export type PreviewPlayer = {
  x: number;
  y: number;
  hp: number;
  attack: number;
  defense: number;
  gold: number;
  yellowKeys: number;
  blueKeys: number;
  redKeys: number;
};

export type PreviewContext = {
  mapData: MapData;
  floorId: number;
  player: PreviewPlayer;
  triggeredEventIds: Set<string>;
  customVars: Record<string, unknown>;
  tileOverrides: Map<string, Tile | null>;
  addLog: (msg: string) => void;
  setPlayer: (p: PreviewPlayer | ((prev: PreviewPlayer) => PreviewPlayer)) => void;
  setFloorId: (id: number) => void;
  setTriggered: (fn: (s: Set<string>) => Set<string>) => void;
  setCustomVars: (fn: (v: Record<string, unknown>) => Record<string, unknown>) => void;
  setTileOverrides: (fn: (m: Map<string, Tile | null>) => Map<string, Tile | null>) => void;
  setCollectedItems: (fn: (s: Set<string>) => Set<string>) => void;
  /** 已击败怪物格：key为 `floorId:x:y`（与 previewMapCellKey 一致） */
  defeatedMonsterKeys: Set<string>;
};

type AnyEvent = GameEvent | TileEvent;

export type PreviewWork = {
  player: PreviewPlayer;
  floorId: number;
  customVars: Record<string, unknown>;
  tileOverrides: Map<string, Tile | null>;
};

export function previewMapCellKey(floorId: number, x: number, y: number) {
  return `${floorId}:${x}:${y}`;
}

function tileKey(floorId: number, x: number, y: number) {
  return previewMapCellKey(floorId, x, y);
}

export function getPreviewTile(
  mapData: MapData,
  floorId: number,
  x: number,
  y: number,
  overrides: Map<string, Tile | null>
): Tile | undefined {
  const o = overrides.get(tileKey(floorId, x, y));
  if (o === null) return undefined;
  if (o) return o;
  const floor = mapData.floors.find(f => f.floorId === floorId);
  return floor?.tiles.find(t => t.x === x && t.y === y);
}

function keysForColor(player: PreviewPlayer, color: string): number {
  switch (color) {
    case 'yellow':
      return player.yellowKeys;
    case 'blue':
      return player.blueKeys;
    case 'red':
      return player.redKeys;
    default:
      return 0;
  }
}

function compareNums(a: number, op: string, b: number): boolean {
  switch (op) {
    case '>=':
      return a >= b;
    case '<=':
      return a <= b;
    case '>':
      return a > b;
    case '<':
      return a < b;
    case '==':
    case '=':
      return a === b;
    default:
      return false;
  }
}

export function evaluateConditions(
  conditions: Condition[],
  logic: ConditionLogic,
  ctx: {
    player: PreviewPlayer;
    floorId: number;
    customVars: Record<string, unknown>;
    triggeredEventIds: Set<string>;
    defeatedMonsterKeys: Set<string>;
  }
): boolean {
  if (!conditions?.length) return true;
  const results = conditions.map(c => evaluateOneCondition(c, ctx));
  return logic === 'or' ? results.some(Boolean) : results.every(Boolean);
}

function evaluateOneCondition(
  c: Condition,
  ctx: {
    player: PreviewPlayer;
    floorId: number;
    customVars: Record<string, unknown>;
    triggeredEventIds: Set<string>;
    defeatedMonsterKeys: Set<string>;
  }
): boolean {
  const p = ctx.player;
  const params = c.params ?? {};
  switch (c.type) {
    case 'key_count': {
      const color = String(params.color ?? 'yellow');
      const count = Number(params.count ?? 0);
      const comp = String(params.comparator ?? '>=');
      return compareNums(keysForColor(p, color), comp, count);
    }
    case 'stat_require': {
      const stat = String(params.stat ?? 'hp');
      const value = Number(params.value ?? 0);
      const comp = String(params.comparator ?? '>=');
      const cur =
        stat === 'hp'
          ? p.hp
          : stat === 'attack'
            ? p.attack
            : stat === 'defense'
              ? p.defense
              : stat === 'gold'
                ? p.gold
                : 0;
      return compareNums(cur, comp, value);
    }
    case 'current_floor': {
      const fid = Number(params.floorId ?? params.floor);
      return ctx.floorId === fid;
    }
    case 'event_triggered': {
      const eid = String(params.eventId ?? '');
      const want = String(params.status ?? 'triggered');
      const done = ctx.triggeredEventIds.has(eid);
      return want === 'not_triggered' ? !done : done;
    }
    case 'has_item': {
      const itemType = String(params.itemType ?? '');
      if (itemType === 'yellowkey') return p.yellowKeys > 0;
      if (itemType === 'bluekey') return p.blueKeys > 0;
      if (itemType === 'redkey') return p.redKeys > 0;
      return false;
    }
    case 'custom_variable': {
      const key = String(params.key ?? '');
      const expected = params.value;
      return ctx.customVars[key] === expected;
    }
    case 'random_probability': {
      const prob = Number(params.probability ?? params.p ?? 0.5);
      return Math.random() < prob;
    }
    case 'monster_defeat_count': {
      const need = Number(params.count ?? 0);
      const comp = String(params.comparator ?? '>=');
      const floorId = params.floorId != null ? Number(params.floorId) : ctx.floorId;
      const prefix = `${floorId}:`;
      const n = [...ctx.defeatedMonsterKeys].filter(k => k.startsWith(prefix)).length;
      return compareNums(n, comp, need);
    }
    case 'monsters_at_defeated': {
      const floorId = params.floorId != null ? Number(params.floorId) : ctx.floorId;
      const positions = params.positions as Array<{ x: number; y: number }> | undefined;
      if (!positions?.length) return true;
      const defeated = ctx.defeatedMonsterKeys;
      return positions.every(
        pos => defeated.has(previewMapCellKey(floorId, Number(pos.x), Number(pos.y)))
      );
    }
    default:
      return true;
  }
}

function findEventById(
  mapData: MapData,
  floorId: number,
  eventId: string,
  tileAt?: Tile
): AnyEvent | undefined {
  const floor = mapData.floors.find(f => f.floorId === floorId);
  if (!floor) return undefined;
  const g = floor.globalEvents.find(e => e.eventId === eventId);
  if (g) return g;
  const c = floor.customEvents.find(e => e.eventId === eventId);
  if (c) return c;
  if (tileAt) {
    return tileAt.events.find(e => e.eventId === eventId);
  }
  return undefined;
}

export function makeTileFromType(typeStr: string, x: number, y: number, floorId: number): Tile | null {
  const preset =
    presetTiles.find(p => p.type === typeStr || p.name === typeStr) ||
    presetTiles.find(p => p.name === typeStr);
  if (!preset) return null;
  const tt = preset.tileType as TileType;
  return {
    id: `preview_${floorId}_${x}_${y}_${typeStr}`,
    x,
    y,
    type: tileKindFromPresetTileType(tt),
    name: preset.type,
    tileType: tt,
    layer: tileLayerFromTileType(preset.tileType),
    src: preset.src,
    properties: {},
    events: []
  };
}

function applyActionMutable(action: Action, work: PreviewWork, ctx: PreviewContext, triggeredSet: Set<string>): void {
  const params = action.params ?? {};
  switch (action.type) {
    case 'show_hint':
    case 'show_dialog': {
      const text = String(params.text ?? params.message ?? '');
      if (text) ctx.addLog(text);
      break;
    }
    case 'change_stat': {
      const stat = String(params.stat ?? 'hp');
      const op = String(params.operation ?? '+');
      const val = Number(params.value ?? 0);
      const apply = (cur: number) =>
        op === '-' || op === 'subtract' ? cur - val : op === '+' || op === 'add' ? cur + val : cur + val;
      const p = work.player;
      if (stat === 'hp') work.player = { ...p, hp: apply(p.hp) };
      else if (stat === 'attack') work.player = { ...p, attack: apply(p.attack) };
      else if (stat === 'defense') work.player = { ...p, defense: apply(p.defense) };
      else if (stat === 'gold') work.player = { ...p, gold: apply(p.gold) };
      break;
    }
    case 'get_item': {
      const itemType = String(params.itemType ?? '');
      const count = Number(params.count ?? 1);
      const p = work.player;
      let n = { ...p };
      if (itemType === 'yellowkey') n.yellowKeys += count;
      else if (itemType === 'bluekey') n.blueKeys += count;
      else if (itemType === 'redkey') n.redKeys += count;
      else if (itemType === 'hp' || itemType === 'hplarge') n.hp += itemType === 'hplarge' ? 200 * count : 100 * count;
      else if (itemType === 'attackgem') n.attack += 5 * count;
      else if (itemType === 'defencegem') n.defense += 5 * count;
      else if (itemType === 'luckycoins' || itemType === 'gold') n.gold += 100 * count;
      work.player = n;
      break;
    }
    case 'consume_key': {
      const color = String(params.color ?? 'yellow');
      const count = Number(params.count ?? 1);
      const p = work.player;
      let n = { ...p };
      if (color === 'yellow') n.yellowKeys = Math.max(0, p.yellowKeys - count);
      if (color === 'blue') n.blueKeys = Math.max(0, p.blueKeys - count);
      if (color === 'red') n.redKeys = Math.max(0, p.redKeys - count);
      work.player = n;
      break;
    }
    case 'consume_item':
      break;
    case 'teleport_player': {
      const tx = Number(params.x ?? params.targetX ?? work.player.x);
      const ty = Number(params.y ?? params.targetY ?? work.player.y);
      const fid = params.floorId != null ? Number(params.floorId) : work.floorId;
      work.floorId = fid;
      work.player = { ...work.player, x: tx, y: ty };
      ctx.addLog(`传送至 第${fid}层 (${tx}, ${ty})`);
      break;
    }
    case 'change_floor': {
      const fid = Number(params.floorId ?? params.floor);
      const floor = ctx.mapData.floors.find(f => f.floorId === fid);
      if (floor) {
        work.floorId = fid;
        work.player = {
          ...work.player,
          x: floor.playerStart.x,
          y: floor.playerStart.y
        };
        ctx.addLog(`切换至第 ${fid} 层`);
      }
      break;
    }
    case 'change_tile': {
      const tx = Number(params.targetX ?? params.x ?? work.player.x);
      const ty = Number(params.targetY ?? params.y ?? work.player.y);
      const fid = params.floorId != null ? Number(params.floorId) : work.floorId;
      const newType = String(params.newTileType ?? 'floor');
      const t = makeTileFromType(newType, tx, ty, fid);
      const next = new Map(work.tileOverrides);
      if (t) next.set(tileKey(fid, tx, ty), t);
      else next.set(tileKey(fid, tx, ty), null);
      work.tileOverrides = next;
      break;
    }
    case 'trigger_custom_event': {
      const eid = String(params.eventId ?? '');
      const tile = getPreviewTile(ctx.mapData, work.floorId, work.player.x, work.player.y, work.tileOverrides);
      const target = findEventById(ctx.mapData, work.floorId, eid, tile);
      if (target) {
        executePreviewEventInternal(target, work, ctx, tile, false, triggeredSet);
      }
      break;
    }
    case 'set_custom_variable': {
      const key = String(params.key ?? '');
      work.customVars = { ...work.customVars, [key]: params.value };
      break;
    }
    case 'game_victory':
      ctx.addLog(String(params.text ?? '游戏胜利！'));
      break;
    case 'game_failure':
      ctx.addLog(String(params.text ?? '游戏失败'));
      break;
    case 'lock_player':
    case 'unlock_player':
    case 'play_sound':
    case 'shake_screen':
    case 'no_op':
      break;
    default:
      break;
  }
}

function executePreviewEventInternal(
  ev: AnyEvent,
  work: PreviewWork,
  ctx: PreviewContext,
  tileAt: Tile | undefined,
  skipMarkTriggered: boolean,
  triggeredSet: Set<string>
): void {
  const evalCtx = {
    player: work.player,
    floorId: work.floorId,
    triggeredEventIds: triggeredSet,
    customVars: work.customVars,
    defeatedMonsterKeys: ctx.defeatedMonsterKeys
  };

  if (!evaluateConditions(ev.conditions ?? [], ev.conditionLogic ?? 'and', evalCtx)) {
    if (ev.conditionFailText) ctx.addLog(ev.conditionFailText);
    return;
  }

  if (!skipMarkTriggered) {
    triggeredSet.add(ev.eventId);
  }

  for (const action of ev.actions ?? []) {
    applyActionMutable(action, work, ctx, triggeredSet);
  }

  if (ev.nextEvent) {
    const next = findEventById(ctx.mapData, work.floorId, ev.nextEvent, tileAt);
    if (next) {
      executePreviewEventInternal(next, work, ctx, tileAt, false, triggeredSet);
    }
  }
}

function flushWorkToContext(work: PreviewWork, ctx: PreviewContext, triggeredSet: Set<string>): void {
  ctx.setPlayer(work.player);
  ctx.setFloorId(work.floorId);
  ctx.setCustomVars(() => work.customVars);
  ctx.setTileOverrides(() => work.tileOverrides);
  ctx.setTriggered(() => new Set(triggeredSet));
}

export function executePreviewEvent(
  ev: AnyEvent,
  ctx: PreviewContext,
  opts?: { tileAt?: Tile; skipMarkTriggered?: boolean }
): void {
  const triggeredSet = new Set(ctx.triggeredEventIds);
  const work: PreviewWork = {
    player: { ...ctx.player },
    floorId: ctx.floorId,
    customVars: { ...ctx.customVars },
    tileOverrides: new Map(ctx.tileOverrides)
  };

  executePreviewEventInternal(ev, work, ctx, opts?.tileAt, opts?.skipMarkTriggered ?? false, triggeredSet);

  flushWorkToContext(work, ctx, triggeredSet);
}

function triggerMatchesDefeat(
  ev: AnyEvent,
  at: { x: number; y: number; floorId: number }
): boolean {
  const tp = ev.trigger?.params as
    | { x?: number; y?: number; floorId?: number; matchAny?: boolean }
    | undefined;
  if (tp?.matchAny === true) return true;
  if (tp?.x === undefined && tp?.y === undefined) return true;
  const fid = tp?.floorId != null ? Number(tp.floorId) : at.floorId;
  return fid === at.floorId && Number(tp?.x) === at.x && Number(tp?.y) === at.y;
}

function runEventsWithTriggerCore(
  events: AnyEvent[],
  triggerType: TriggerType,
  ctx: PreviewContext,
  opts?: { tileAt?: Tile; bumpDirection?: string; defeatAt?: { x: number; y: number; floorId: number } }
): { work: PreviewWork; triggeredSet: Set<string> } {
  const triggeredSet = new Set(ctx.triggeredEventIds);
  const work: PreviewWork = {
    player: { ...ctx.player },
    floorId: ctx.floorId,
    customVars: { ...ctx.customVars },
    tileOverrides: new Map(ctx.tileOverrides)
  };

  for (const ev of events) {
    if (ev.trigger?.type !== triggerType) continue;
    if (triggerType === 'bump_tile' && opts?.bumpDirection && opts.bumpDirection !== 'any') {
      const want = (ev.trigger.params as { direction?: string })?.direction ?? 'any';
      if (want !== 'any' && want !== opts.bumpDirection) continue;
    }
    if (triggerType === 'defeat_monster' && opts?.defeatAt) {
      if (!triggerMatchesDefeat(ev, opts.defeatAt)) continue;
    }
    executePreviewEventInternal(ev, work, ctx, opts?.tileAt, false, triggeredSet);
  }

  return { work, triggeredSet };
}

export function runEventsWithTrigger(
  events: AnyEvent[],
  triggerType: TriggerType,
  ctx: PreviewContext,
  opts?: { tileAt?: Tile; bumpDirection?: string; defeatAt?: { x: number; y: number; floorId: number } }
): void {
  const { work, triggeredSet } = runEventsWithTriggerCore(events, triggerType, ctx, opts);
  flushWorkToContext(work, ctx, triggeredSet);
}

/** 执行后返回 work，便于同帧内继续串联其它触发（如击败后再判 step_on_tile） */
export function runEventsWithTriggerReturnWork(
  events: AnyEvent[],
  triggerType: TriggerType,
  ctx: PreviewContext,
  opts?: { tileAt?: Tile; bumpDirection?: string; defeatAt?: { x: number; y: number; floorId: number } }
): PreviewWork {
  const { work, triggeredSet } = runEventsWithTriggerCore(events, triggerType, ctx, opts);
  flushWorkToContext(work, ctx, triggeredSet);
  return work;
}

export function runGameInitEvents(
  floor: { globalEvents: GameEvent[]; customEvents: GameEvent[] },
  ctx: PreviewContext
): void {
  const all = [...floor.globalEvents, ...floor.customEvents];
  runEventsWithTrigger(all, 'game_init', ctx);
}
