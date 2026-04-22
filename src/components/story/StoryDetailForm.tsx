import { useEffect, useRef } from 'react';
import { Input, InputNumber, Space, Switch, Typography } from 'antd';
import type { MapData } from '../../types/map';
import type { Story, StoryTrigger } from '../../types/story';
import type { StoryFlowFocus } from '../../utils/storyFlowAdapter';
import { getNpcNamesOnFloor, getSelectedTileCoordString } from '../../utils/storyMapBridge';
import TriggerFields from './TriggerFields';
import ActionFields from './ActionFields';
import { message } from 'antd';

const { Text } = Typography;

export interface StoryDetailFormProps {
  story: Story;
  onChange: (s: Story) => void;
  mapData: MapData;
  selectedTileId: string | null;
  selectedGrid: { x: number; y: number } | null;
  selectedFlowFocus?: StoryFlowFocus;
}

export default function StoryDetailForm({
  story,
  onChange,
  mapData,
  selectedTileId,
  selectedGrid,
  selectedFlowFocus = null
}: StoryDetailFormProps) {
  const triggerBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedFlowFocus) return;
    if (selectedFlowFocus.kind === 'trigger') {
      triggerBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      document
        .getElementById(`story-action-${selectedFlowFocus.index}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedFlowFocus]);
  const npcFloor =
    story.trigger.type === 'npc_interact' && story.trigger.floor !== undefined
      ? story.trigger.floor
      : mapData.currentFloor;
  const npcOptionsFromMap = getNpcNamesOnFloor(mapData, npcFloor);

  const applyMapTile = () => {
    const coord = getSelectedTileCoordString(mapData, selectedTileId, selectedGrid);
    if (!coord) {
      message.warning('请切换到「地图编辑」，在画布上选中一个格子');
      return;
    }
    if (story.trigger.type === 'tile_enter') {
      onChange({
        ...story,
        trigger: { ...story.trigger, tile: coord }
      });
      message.success(`已填入格子 ${coord}`);
    }
  };

  const applyAppearPos = (actionIndex: number, entityIndex: number) => {
    const coord = getSelectedTileCoordString(mapData, selectedTileId, selectedGrid);
    if (!coord) {
      message.warning('请切换到「地图编辑」，在画布上选中一个格子');
      return;
    }
    const actions = [...story.actions];
    const raw = actions[actionIndex];
    if (!raw || raw.type !== 'appear') return;
    const entities = [...(Array.isArray(raw.entities) ? raw.entities : [])];
    const ent = { ...(entities[entityIndex] as object), pos: coord };
    entities[entityIndex] = ent;
    actions[actionIndex] = { ...raw, type: 'appear', entities };
    onChange({ ...story, actions });
    message.success(`实体 ${entityIndex + 1} pos 已设为 ${coord}`);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div>
        <Text strong>基本信息</Text>
        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size="small">
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>id（建议字符串，存档用 str(id)）</div>
            <Input
              value={String(story.id)}
              onChange={(e) => onChange({ ...story, id: e.target.value })}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>desc（备注）</div>
            <Input value={story.desc ?? ''} onChange={(e) => onChange({ ...story, desc: e.target.value })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#999' }}>repeatable</span>
            <Switch checked={story.repeatable === true} onChange={(v) => onChange({ ...story, repeatable: v })} />
          </div>
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>order（同触发键下排序）</div>
            <InputNumber
              style={{ width: '100%' }}
              value={story.order ?? 0}
              onChange={(v) => onChange({ ...story, order: v === null ? 0 : Number(v) })}
            />
          </div>
        </Space>
      </div>

      <div
        ref={triggerBlockRef}
        id="story-trigger-block"
        style={
          selectedFlowFocus?.kind === 'trigger'
            ? { outline: '1px solid rgba(24,144,255,0.6)', borderRadius: 8, padding: 8 }
            : undefined
        }
      >
        <Text strong>触发器</Text>
        <div style={{ marginTop: 8 }}>
          <TriggerFields
            value={story.trigger as StoryTrigger}
            onChange={(t) => onChange({ ...story, trigger: t })}
            npcOptionsFromMap={npcOptionsFromMap}
            onPickTileFromMap={story.trigger.type === 'tile_enter' ? applyMapTile : undefined}
            mapPickTileLabel="使用地图选中格"
          />
        </div>
      </div>

      <div>
        <Text strong>动作列表</Text>
        <div style={{ marginTop: 8 }}>
          <ActionFields
            actions={story.actions}
            onChange={(actions) => onChange({ ...story, actions })}
            onPickAppearEntityPos={applyAppearPos}
            appearPickHint="地图选格"
            highlightedActionIndex={
              selectedFlowFocus?.kind === 'action' ? selectedFlowFocus.index : null
            }
          />
        </div>
      </div>
    </Space>
  );
}
