import type { StoryRoot, StoryTrigger } from '../types/story';

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface StoryValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

const TILE_RE = /^\d+,\d+$/;
const NUM_RE = /^\d+$/;

function isStoryPos(v: unknown): boolean {
  return (
    typeof v === 'number' ||
    (typeof v === 'string' && (TILE_RE.test(v.trim()) || NUM_RE.test(v.trim()))) ||
    (typeof v === 'object' &&
      v !== null &&
      !Array.isArray(v) &&
      'x' in v &&
      'y' in v &&
      typeof (v as { x: unknown }).x === 'number' &&
      typeof (v as { y: unknown }).y === 'number')
  );
}

function strId(id: string | number): string {
  return String(id);
}

function validateTrigger(trigger: StoryTrigger | undefined, basePath: string, errors: ValidationIssue[]) {
  if (!trigger || typeof trigger !== 'object' || !('type' in trigger)) {
    errors.push({ path: `${basePath}.trigger`, message: '缺少触发器' });
    return;
  }
  const t = trigger.type;
  if (t === 'floor_enter') {
    if (typeof trigger.floor !== 'number') {
      errors.push({ path: `${basePath}.trigger.floor`, message: 'floor_enter 需要 floor（数字）' });
    }
  } else if (t === 'tile_enter') {
    if (typeof trigger.floor !== 'number') {
      errors.push({ path: `${basePath}.trigger.floor`, message: 'tile_enter 需要 floor' });
    }
    if (typeof trigger.tile !== 'string' || !TILE_RE.test(trigger.tile.trim())) {
      errors.push({ path: `${basePath}.trigger.tile`, message: 'tile 须为 "x,y" 格式' });
    }
  } else if (t === 'npc_interact') {
    if (typeof trigger.npc !== 'string' || !trigger.npc.trim()) {
      errors.push({ path: `${basePath}.trigger.npc`, message: 'npc_interact 需要 npc' });
    }
    if (trigger.floor !== undefined && typeof trigger.floor !== 'number') {
      errors.push({ path: `${basePath}.trigger.floor`, message: 'floor 若填写须为数字' });
    }
  } else if (t === 'monsters_defeated') {
    if (typeof trigger.floor !== 'number') {
      errors.push({ path: `${basePath}.trigger.floor`, message: 'monsters_defeated 需要 floor' });
    }
    const pos = trigger.positions ?? trigger.tiles;
    if (!Array.isArray(pos) || pos.length === 0) {
      errors.push({
        path: `${basePath}.trigger.positions`,
        message: '须提供 positions 或 tiles 非空数组'
      });
    }
    if (trigger.match !== undefined && trigger.match !== 'all' && trigger.match !== 'any') {
      errors.push({ path: `${basePath}.trigger.match`, message: 'match 须为 all 或 any' });
    }
  } else {
    errors.push({ path: `${basePath}.trigger.type`, message: `未知触发器类型: ${String(t)}` });
  }
}

function validateAction(
  action: Record<string, unknown> | undefined,
  i: number,
  basePath: string,
  errors: ValidationIssue[],
  ctx: { eventKeys: Set<string> | null; propNames: Set<string> | null }
) {
  const p = `${basePath}.actions[${i}]`;
  if (!action || typeof action !== 'object') {
    errors.push({ path: p, message: '动作须为对象' });
    return;
  }
  const type = action.type;
  if (typeof type !== 'string') {
    errors.push({ path: `${p}.type`, message: '缺少 type' });
    return;
  }
  if (action.delay !== undefined && typeof action.delay !== 'number') {
    errors.push({ path: `${p}.delay`, message: 'delay 须为数字（毫秒）' });
  }
  switch (type) {
    case 'chat': {
      const content = action.content;
      if (!Array.isArray(content)) {
        errors.push({ path: `${p}.content`, message: 'chat 需要 content 数组' });
      }
      break;
    }
    case 'playSound': {
      if (typeof action.sound !== 'string' || !action.sound.trim()) {
        errors.push({ path: `${p}.sound`, message: 'playSound 需要 sound 路径' });
      }
      break;
    }
    case 'screenFade': {
      if (typeof action.animationType !== 'string' || !action.animationType.trim()) {
        errors.push({ path: `${p}.animationType`, message: 'screenFade 需要 animationType' });
      }
      break;
    }
    case 'appear': {
      if (!Array.isArray(action.entities) || action.entities.length === 0) {
        errors.push({ path: `${p}.entities`, message: 'appear 需要 entities 非空数组' });
      }
      break;
    }
    case 'move': {
      const ent = action.entity;
      const okEnt =
        ent === 'player' ||
        (ent &&
          typeof ent === 'object' &&
          !Array.isArray(ent) &&
          String((ent as { type?: unknown }).type ?? '') === 'npc' &&
          (typeof (ent as { npcId?: unknown; id?: unknown }).npcId === 'string' ||
            typeof (ent as { npcId?: unknown; id?: unknown }).id === 'string'));
      if (!okEnt) {
        errors.push({
          path: `${p}.entity`,
          message: 'move.entity 须为 "player" 或 {type:"npc", npcId:"..."}（也兼容 id 字段）'
        });
      }
      if (!isStoryPos(action.to)) {
        errors.push({ path: `${p}.to`, message: 'move.to 必填，且须为数字、"x,y" 或 {x,y}' });
      }
      if (action.from !== undefined && !isStoryPos(action.from)) {
        errors.push({ path: `${p}.from`, message: 'move.from 若填写须为数字、"x,y" 或 {x,y}' });
      }
      if (action.stepMs !== undefined && typeof action.stepMs !== 'number') {
        errors.push({ path: `${p}.stepMs`, message: 'move.stepMs 若填写须为数字' });
      }
      break;
    }
    case 'removeTile': {
      if (!isStoryPos(action.pos)) {
        errors.push({ path: `${p}.pos`, message: 'removeTile.pos 必填，且须为数字、"x,y" 或 {x,y}' });
      }
      if (action.kind !== undefined && typeof action.kind !== 'string') {
        errors.push({ path: `${p}.kind`, message: 'removeTile.kind 若填写须为字符串' });
      }
      if (action.name !== undefined && typeof action.name !== 'string') {
        errors.push({ path: `${p}.name`, message: 'removeTile.name 若填写须为字符串' });
      }
      break;
    }
    case 'changeFloor': {
      if (typeof action.floor !== 'number') {
        errors.push({ path: `${p}.floor`, message: 'changeFloor 需要 floor' });
      }
      if (action.playerPos !== undefined) {
        const pos = action.playerPos;
        if (!isStoryPos(pos)) {
          errors.push({
            path: `${p}.playerPos`,
            message: 'playerPos 须为数字、"x,y" 字符串，或 {x,y} 对象'
          });
        }
      }
      break;
    }
    case 'changePlayerState': {
      const changes = action.changes;
      const hasFlat =
        changes === undefined &&
        Object.keys(action).some(
          k => !['type', 'delay', 'changes'].includes(k) && typeof action[k] === 'number'
        );
      if (changes !== undefined && (typeof changes !== 'object' || changes === null || Array.isArray(changes))) {
        errors.push({ path: `${p}.changes`, message: 'changes 须为对象' });
      } else if (changes === undefined && !hasFlat) {
        errors.push({ path: p, message: 'changePlayerState 需要 changes 或数值字段' });
      }
      break;
    }
    case 'giveItem': {
      const items = action.items ?? action.itemIds;
      if (!Array.isArray(items) || !items.every(x => typeof x === 'string')) {
        errors.push({ path: `${p}.items`, message: 'giveItem 需要 items 或 itemIds 字符串数组' });
      } else if (
        ctx.propNames &&
        ctx.propNames.size > 0 &&
        items.some(name => !ctx.propNames!.has(String(name)))
      ) {
        errors.push({ path: `${p}.items`, message: '部分物品名在 prop.json 中不存在' });
      }
      break;
    }
    case 'runEvent': {
      const id = action.eventId ?? action.id;
      if (typeof id !== 'string' && typeof id !== 'number') {
        errors.push({ path: `${p}.eventId`, message: 'runEvent 需要 eventId 或 id' });
      } else if (ctx.eventKeys && ctx.eventKeys.size > 0 && !ctx.eventKeys.has(String(id))) {
        errors.push({ path: `${p}.eventId`, message: `事件 id 在 event.json 中不存在: ${id}` });
      }
      break;
    }
    default:
      break;
  }
}

export function collectTriggerConflicts(doc: StoryRoot): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];
  type Key = string;
  const tileMap = new Map<Key, string[]>();
  const npcMap = new Map<Key, string[]>();

  doc.stories.forEach(story => {
    const idLabel = strId(story.id);
    const tr = story.trigger;
    if (!tr || typeof tr !== 'object') return;
    if (tr.type === 'tile_enter') {
      const k = `${tr.floor}|${String(tr.tile).trim()}`;
      const arr = tileMap.get(k) ?? [];
      arr.push(idLabel);
      tileMap.set(k, arr);
    } else if (tr.type === 'npc_interact') {
      const floorKey = tr.floor === undefined ? '__any__' : String(tr.floor);
      const k = `${tr.npc}|${floorKey}`;
      const arr = npcMap.get(k) ?? [];
      arr.push(idLabel);
      npcMap.set(k, arr);
    }
  });

  const pushDup = (label: string, ids: string[]) => {
    if (ids.length > 1) {
      warnings.push({
        path: 'stories',
        message: `${label} 多条剧情共用触发键 [${ids.join(', ')}]，执行顺序依赖 order 与 id`
      });
    }
  };

  tileMap.forEach((ids, k) => {
    pushDup(`格子触发 ${k}`, ids);
  });
  npcMap.forEach((ids, k) => {
    pushDup(`NPC 触发 ${k}`, ids);
  });

  return warnings;
}

export function validateStoryDocument(
  doc: StoryRoot,
  options?: {
    eventJsonKeys?: string[];
    propJsonNames?: string[];
  }
): StoryValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!Array.isArray(doc.stories)) {
    errors.push({ path: 'stories', message: 'stories 须为数组' });
    return { errors, warnings };
  }

  const seen = new Map<string, number>();
  doc.stories.forEach((story, idx) => {
    const basePath = `stories[${idx}]`;
    if (story.id === undefined || story.id === '') {
      errors.push({ path: `${basePath}.id`, message: 'id 不能为空' });
    } else {
      const sid = strId(story.id as string | number);
      const prev = seen.get(sid);
      if (prev !== undefined) {
        errors.push({
          path: `${basePath}.id`,
          message: `id 与 stories[${prev}] 重复: ${sid}`
        });
      } else {
        seen.set(sid, idx);
      }
    }
    validateTrigger(story.trigger as StoryTrigger | undefined, basePath, errors);
    if (!Array.isArray(story.actions)) {
      errors.push({ path: `${basePath}.actions`, message: 'actions 须为数组' });
    } else {
      const eventKeys = options?.eventJsonKeys ? new Set(options.eventJsonKeys.map(String)) : null;
      const propNames = options?.propJsonNames ? new Set(options.propJsonNames.map(String)) : null;
      story.actions.forEach((act, i) => {
        validateAction(act as Record<string, unknown>, i, basePath, errors, { eventKeys, propNames });
      });
    }
  });

  warnings.push(...collectTriggerConflicts(doc));

  return { errors, warnings };
}

export function summarizeTrigger(trigger: StoryTrigger | undefined): string {
  if (!trigger || typeof trigger !== 'object' || !('type' in trigger)) return '—';
  switch (trigger.type) {
    case 'floor_enter':
      return `进层 floor=${trigger.floor}`;
    case 'tile_enter':
      return `踩格 ${trigger.floor} / ${trigger.tile}`;
    case 'npc_interact':
      return trigger.floor !== undefined
        ? `NPC ${trigger.npc} @层${trigger.floor}`
        : `NPC ${trigger.npc}（任意层）`;
    case 'monsters_defeated':
      return `清怪 层${trigger.floor} (${(trigger.positions ?? trigger.tiles ?? []).length}格)`;
    default:
      return String((trigger as { type: string }).type);
  }
}
