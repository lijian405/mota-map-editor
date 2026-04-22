import type { Edge, Node } from '@xyflow/react';
import type { Story, StoryAction, StoryRoot } from '../types/story';

export function triggerNodeId(storyIndex: number): string {
  return `t:${storyIndex}`;
}

export function actionNodeId(storyIndex: number, actionIndex: number): string {
  return `a:${storyIndex}:${actionIndex}`;
}

const Y_GAP = 100;

export function defaultPosition(storyIndex: number, kind: 'trigger' | 'action', actionIndex?: number): { x: number; y: number } {
  const row = kind === 'trigger' ? 0 : (actionIndex ?? 0) + 1;
  return { x: storyIndex * 40, y: row * Y_GAP };
}

function getPos(
  positions: Record<string, { x: number; y: number }> | undefined,
  id: string,
  fallback: { x: number; y: number }
): { x: number; y: number } {
  const p = positions?.[id];
  return p && typeof p.x === 'number' && typeof p.y === 'number' ? { x: p.x, y: p.y } : fallback;
}

function copyStoryLayout(
  source: Record<string, { x: number; y: number }>,
  fromIdx: number,
  toIdx: number,
  target: Record<string, { x: number; y: number }>
) {
  const ft = triggerNodeId(fromIdx);
  const tt = triggerNodeId(toIdx);
  if (source[ft]) target[tt] = { ...source[ft] };
  for (let ai = 0; ai < 500; ai++) {
    const fk = actionNodeId(fromIdx, ai);
    if (!source[fk]) break;
    target[actionNodeId(toIdx, ai)] = { ...source[fk] };
  }
}

/** 删除第 removedIndex 条剧情后的布局（原 n 条） */
export function graphPositionsAfterRemoveStory(
  positions: Record<string, { x: number; y: number }>,
  removedIndex: number,
  n: number
): Record<string, { x: number; y: number }> {
  if (n <= 1) return {};
  const next: Record<string, { x: number; y: number }> = {};
  for (let oldJ = 0; oldJ < n; oldJ++) {
    if (oldJ === removedIndex) continue;
    const newJ = oldJ < removedIndex ? oldJ : oldJ - 1;
    copyStoryLayout(positions, oldJ, newJ, next);
  }
  return next;
}

/**
 * 在 duplicateIndex 处插入副本后的布局（插入前共 n 条剧情）。
 * 新剧情位于 duplicateIndex+1，与 duplicateIndex 共用同一套坐标副本。
 */
export function graphPositionsAfterDuplicateStory(
  positions: Record<string, { x: number; y: number }>,
  duplicateIndex: number,
  n: number
): Record<string, { x: number; y: number }> {
  const next: Record<string, { x: number; y: number }> = {};
  for (let oldJ = 0; oldJ < n; oldJ++) {
    if (oldJ < duplicateIndex) {
      copyStoryLayout(positions, oldJ, oldJ, next);
    } else if (oldJ === duplicateIndex) {
      copyStoryLayout(positions, duplicateIndex, duplicateIndex, next);
      copyStoryLayout(positions, duplicateIndex, duplicateIndex + 1, next);
    } else {
      copyStoryLayout(positions, oldJ, oldJ + 1, next);
    }
  }
  return next;
}

/** 移动剧情条目后：order[newIdx] = 原来的 story 下标 */
export function permutationAfterMove(from: number, to: number, n: number): number[] {
  const order = [...Array(n).keys()];
  const [x] = order.splice(from, 1);
  order.splice(to, 0, x);
  return order;
}

export function remapStoryGraphPositions(
  positions: Record<string, { x: number; y: number }>,
  perm: number[]
): Record<string, { x: number; y: number }> {
  const next: Record<string, { x: number; y: number }> = {};
  for (let newIdx = 0; newIdx < perm.length; newIdx++) {
    const oldIdx = perm[newIdx];
    copyStoryLayout(positions, oldIdx, newIdx, next);
  }
  return next;
}

export function summarizeAction(act: StoryAction | undefined): string {
  if (!act || typeof act !== 'object') return '—';
  const t = act.type;
  switch (t) {
    case 'chat': {
      const c = act.content;
      if (Array.isArray(c) && c.length > 0) {
        const first = c[0];
        if (typeof first === 'string') return first.slice(0, 40);
        if (first && typeof first === 'object' && 'content' in first) {
          const txt = first.content;
          const s = Array.isArray(txt) ? txt.join(' ') : String(txt ?? '');
          return s.slice(0, 40);
        }
      }
      return 'chat';
    }
    case 'runEvent':
      return `event ${act.eventId ?? act.id ?? ''}`;
    case 'playSound':
      return String(act.sound ?? '').slice(0, 36);
    case 'changeFloor':
      return `→层 ${act.floor}${
        act.playerPos !== undefined
          ? ` @${typeof act.playerPos === 'object' && act.playerPos ? `${(act.playerPos as { x: number }).x},${(act.playerPos as { y: number }).y}` : String(act.playerPos)}`
          : ''
      }`;
    case 'appear':
      return `appear ×${Array.isArray(act.entities) ? act.entities.length : 0}`;
    case 'giveItem': {
      const raw = act.items ?? act.itemIds;
      const arr = Array.isArray(raw) ? raw.map(String) : [];
      return `items ${arr.join(',')}`.slice(0, 40);
    }
    default:
      return String(t);
  }
}

export type StoryFlowFocus = { kind: 'trigger' } | { kind: 'action'; index: number } | null;

export function buildFlowElements(
  story: Story,
  storyIndex: number,
  positions: Record<string, { x: number; y: number }> | undefined,
  flowFocus: StoryFlowFocus = null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const tid = triggerNodeId(storyIndex);
  const tPos = getPos(positions, tid, defaultPosition(storyIndex, 'trigger'));
  nodes.push({
    id: tid,
    type: 'trigger',
    position: tPos,
    data: { storyIndex, summary: story.trigger },
    draggable: true,
    selectable: true,
    selected: flowFocus?.kind === 'trigger'
  });

  const actions = Array.isArray(story.actions) ? story.actions : [];
  let prevId = tid;

  actions.forEach((act, ai) => {
    const aid = actionNodeId(storyIndex, ai);
    const pos = getPos(positions, aid, defaultPosition(storyIndex, 'action', ai));
    nodes.push({
      id: aid,
      type: 'action',
      position: pos,
      data: { storyIndex, actionIndex: ai, action: act },
      draggable: true,
      selectable: true,
      selected: flowFocus?.kind === 'action' && flowFocus.index === ai
    });
    edges.push({
      id: `e-${prevId}-${aid}`,
      source: prevId,
      target: aid,
      type: 'smoothstep',
      selectable: false,
      focusable: false
    });
    prevId = aid;
  });

  return { nodes, edges };
}

export function mergePositionsIntoDocument(
  doc: StoryRoot,
  updates: Record<string, { x: number; y: number }>
): StoryRoot {
  return {
    ...doc,
    _storyGraph: {
      version: 1,
      positions: { ...(doc._storyGraph?.positions ?? {}), ...updates }
    }
  };
}
