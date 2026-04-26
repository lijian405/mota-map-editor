import { Button, Input, InputNumber, Select, Space } from 'antd';
import type { StoryTrigger, TriggerType } from '../../types/story';

const TRIGGER_TYPES: { value: TriggerType; label: string }[] = [
  { value: 'floor_enter', label: '进入楼层 (floor_enter)' },
  { value: 'tile_enter', label: '踩格 (tile_enter)' },
  { value: 'npc_interact', label: 'NPC 对话 (npc_interact)' },
  { value: 'monsters_defeated', label: '击败怪物 (monsters_defeated)' },
  { value: 'all_airwalls_revealed', label: '隐形墙全触发 (all_airwalls_revealed)' }
];

function toNumberOr(v: unknown, fallback: number): number {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function defaultTrigger(type: TriggerType): StoryTrigger {
  switch (type) {
    case 'floor_enter':
      return { type: 'floor_enter', floor: 0 };
    case 'tile_enter':
      return { type: 'tile_enter', floor: 0, tile: '1,1' };
    case 'npc_interact':
      return { type: 'npc_interact', npc: '1' };
    case 'monsters_defeated':
      return { type: 'monsters_defeated', floor: 0, positions: ['1,1'], match: 'all' };
    case 'all_airwalls_revealed':
      return { type: 'all_airwalls_revealed', floor: 0 };
  }
}

export interface TriggerFieldsProps {
  value: StoryTrigger;
  onChange: (t: StoryTrigger) => void;
  npcOptionsFromMap?: string[];
  onPickTileFromMap?: () => void;
  mapPickTileLabel?: string;
}

export default function TriggerFields({
  value,
  onChange,
  npcOptionsFromMap = [],
  onPickTileFromMap,
  mapPickTileLabel = '使用地图选中格'
}: TriggerFieldsProps) {
  const switchType = (type: TriggerType) => {
    onChange(defaultTrigger(type));
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <div style={{ marginBottom: 4, color: '#999' }}>触发类型</div>
        <Select
          style={{ width: '100%' }}
          value={value.type}
          options={TRIGGER_TYPES}
          onChange={(v) => switchType(v as TriggerType)}
        />
      </div>
      {value.type === 'floor_enter' && (
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>楼层 floor</div>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={value.floor}
            onChange={(v) => onChange({ ...value, floor: toNumberOr(v, 0) })}
          />
        </div>
      )}
      {value.type === 'tile_enter' && (
        <>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>楼层 floor</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={value.floor}
              onChange={(v) => onChange({ ...value, floor: toNumberOr(v, 0) })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>格子 tile（x,y）</div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={value.tile}
                onChange={(e) => onChange({ ...value, tile: e.target.value })}
                placeholder="如 1,1"
              />
              {onPickTileFromMap && (
                <Button onClick={onPickTileFromMap}>{mapPickTileLabel}</Button>
              )}
            </Space.Compact>
          </div>
        </>
      )}
      {value.type === 'npc_interact' && (
        <>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>NPC id（npc）</div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={value.npc}
                onChange={(e) => onChange({ ...value, npc: e.target.value })}
                placeholder="与地图 NPC 瓦片 name 一致"
              />
              {npcOptionsFromMap.length > 0 && (
                <Select
                  style={{ minWidth: 120 }}
                  placeholder="从地图选"
                  allowClear
                  options={npcOptionsFromMap.map(n => ({ value: n, label: n }))}
                  onChange={(v) => v && onChange({ ...value, npc: v })}
                />
              )}
            </Space.Compact>
          </div>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>限定楼层（可选）</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="留空=任意层"
              value={value.floor}
              onChange={(v) =>
                onChange(
                  v === null || v === undefined
                    ? { type: 'npc_interact', npc: value.npc }
                    : { ...value, floor: Number(v) }
                )
              }
            />
          </div>
        </>
      )}
      {value.type === 'monsters_defeated' && (
        <>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>楼层 floor</div>
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={value.floor}
              onChange={(v) => onChange({ ...value, floor: toNumberOr(v, 0) })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>positions / tiles（每行 x,y 或数字下标）</div>
            <Input.TextArea
              rows={4}
              value={positionLines(value)}
              onChange={(e) => onChange({ ...value, positions: parsePositionLines(e.target.value) })}
              placeholder={'每行一个，如：\n3,4\n5,6'}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>match</div>
            <Select
              style={{ width: '100%' }}
              value={value.match ?? 'all'}
              options={[
                { value: 'all', label: 'all（全部格需清）' },
                { value: 'any', label: 'any（任一即可）' }
              ]}
              onChange={(v) => onChange({ ...value, match: v as 'all' | 'any' })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>
              monsterIds（逗号分隔，与 positions 下标对齐，可留空）
            </div>
            <Input
              value={(value.monsterIds ?? []).join(',')}
              onChange={(e) => {
                const parts = e.target.value.split(',').map(s => s.trim());
                onChange({
                  ...value,
                  monsterIds: parts.length && parts.some(p => p.length > 0) ? parts : undefined
                });
              }}
              placeholder="如 100,,100 表示仅校验第1、3格怪物名"
            />
          </div>
        </>
      )}
      {value.type === 'all_airwalls_revealed' && (
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>楼层 floor</div>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={value.floor}
            onChange={(v) => onChange({ ...value, floor: toNumberOr(v, 0) })}
          />
        </div>
      )}
    </Space>
  );
}

function positionLines(t: Extract<StoryTrigger, { type: 'monsters_defeated' }>): string {
  const arr = t.positions ?? t.tiles ?? [];
  return arr
    .map(p => {
      if (typeof p === 'string') return p;
      if (typeof p === 'number') return String(p);
      if (p && typeof p === 'object' && 'x' in p && 'y' in p) {
        return `${p.x},${p.y}`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function parsePositionLines(text: string): (string | number)[] {
  return text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(line => {
      if (/^\d+$/.test(line)) return parseInt(line, 10);
      return line;
    });
}
