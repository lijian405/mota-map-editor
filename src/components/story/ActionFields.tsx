import { useState } from 'react';
import { Button, Card, Input, InputNumber, Select, Space, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { presetTiles } from '../../data/presetTiles';
import type {
  AppearEntity,
  ChatContentLine,
  StoryAction,
  StoryActionType,
  StoryPos
} from '../../types/story';
import { isPlaceholderActionType } from '../../types/story';

const { Text } = Typography;

const MONSTER_NAME_OPTIONS = Array.from(
  new Set(presetTiles.filter(t => t.tileType === 'monster').map(t => String(t.name)))
).map(name => ({ value: name, label: name }));

const ITEM_NAME_OPTIONS = Array.from(
  new Set(presetTiles.filter(t => t.tileType === 'item').map(t => String(t.name)))
).map(name => ({ value: name, label: name }));

const ACTION_OPTIONS: { value: StoryActionType; label: string; placeholder?: boolean }[] = [
  { value: 'chat', label: '对话 (chat)' },
  { value: 'playSound', label: '音效 (playSound)' },
  { value: 'screenFade', label: '淡入淡出 (screenFade)' },
  { value: 'appear', label: '生成实体 (appear)' },
  { value: 'move', label: '寻路移动 (move)' },
  { value: 'removeTile', label: '移除图块 (removeTile)' },
  { value: 'changeFloor', label: '切换楼层 (changeFloor)' },
  { value: 'changePlayerState', label: '修改玩家属性 (changePlayerState)' },
  { value: 'giveItem', label: '给予物品 (giveItem)' },
  { value: 'runEvent', label: '运行旧事件 (runEvent)' },
  { value: 'playTileAnimation', label: '图块动画（占位）', placeholder: true },
  { value: 'spawnTile', label: '刷瓷砖 spawnTile（占位）', placeholder: true },
  { value: 'spwanTile', label: '刷瓷砖 spwanTile（占位）', placeholder: true }
];

function defaultAction(type: StoryActionType): StoryAction {
  switch (type) {
    case 'chat':
      return { type: 'chat', content: [] };
    case 'playSound':
      return { type: 'playSound', sound: '' };
    case 'screenFade':
      return { type: 'screenFade', animationType: 'fadeIn' };
    case 'appear':
      return { type: 'appear', entities: [] };
    case 'move':
      return { type: 'move', entity: 'player', to: '1,1', stepMs: 120 };
    case 'removeTile':
      return { type: 'removeTile', pos: '1,1' };
    case 'changeFloor':
      return { type: 'changeFloor', floor: 1, playerPos: undefined };
    case 'changePlayerState':
      return { type: 'changePlayerState', changes: { hp: 0, gold: 0 } };
    case 'giveItem':
      return { type: 'giveItem', items: [] };
    case 'runEvent':
      return { type: 'runEvent', eventId: '' };
    default:
      return { type };
  }
}

function stripForNewType(prev: StoryAction, type: StoryActionType): StoryAction {
  const delay = typeof prev.delay === 'number' ? prev.delay : undefined;
  const base = defaultAction(type);
  if (delay !== undefined) return { ...base, delay };
  return base;
}

export interface ActionFieldsProps {
  actions: StoryAction[];
  onChange: (actions: StoryAction[]) => void;
  /** 为 appear 某实体的 pos 填入地图当前选中格 */
  onPickAppearEntityPos?: (actionIndex: number, entityIndex: number) => void;
  appearPickHint?: string;
  /** 与节点画布联动高亮 */
  highlightedActionIndex?: number | null;
}

export default function ActionFields({
  actions,
  onChange,
  onPickAppearEntityPos,
  appearPickHint,
  highlightedActionIndex = null
}: ActionFieldsProps) {
  const addAction = () => {
    onChange([...actions, defaultAction('chat')]);
  };

  const patch = (i: number, next: StoryAction) => {
    const copy = [...actions];
    copy[i] = next;
    onChange(copy);
  };

  const remove = (i: number) => {
    onChange(actions.filter((_, j) => j !== i));
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= actions.length) return;
    const copy = [...actions];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Button type="dashed" icon={<PlusOutlined />} onClick={addAction} block>
        添加动作
      </Button>
      {actions.map((act, i) => (
        <Card
          id={`story-action-${i}`}
          key={i}
          size="small"
          title={`动作 #${i + 1}`}
          style={
            highlightedActionIndex === i
              ? { borderColor: '#1890ff', boxShadow: '0 0 0 1px rgba(24,144,255,0.5)' }
              : undefined
          }
          extra={
            <Space>
              <Button type="text" size="small" icon={<ArrowUpOutlined />} onClick={() => move(i, -1)} disabled={i === 0} />
              <Button
                type="text"
                size="small"
                icon={<ArrowDownOutlined />}
                onClick={() => move(i, 1)}
                disabled={i === actions.length - 1}
              />
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(i)} />
            </Space>
          }
        >
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div>
              <div style={{ marginBottom: 4, color: '#999' }}>类型</div>
              <Select
                style={{ width: '100%' }}
                value={act.type as StoryActionType}
                options={ACTION_OPTIONS.map(o => ({
                  value: o.value,
                  label: o.label,
                  disabled: false
                }))}
                onChange={(v) => patch(i, stripForNewType(act, v as StoryActionType))}
              />
            </div>
            {isPlaceholderActionType(String(act.type)) && (
              <Text type="warning">此动作类型运行时暂无逻辑，仅保留 JSON。</Text>
            )}
            <div>
              <div style={{ marginBottom: 4, color: '#999' }}>delay（毫秒，可选）</div>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={act.delay}
                onChange={(v) => patch(i, { ...act, delay: v === null ? undefined : Number(v) })}
              />
            </div>
            <ActionTypeFields
              action={act}
              actionIndex={i}
              onPatch={(next) => patch(i, next)}
              onPickAppearEntityPos={onPickAppearEntityPos}
              appearPickHint={appearPickHint}
            />
          </Space>
        </Card>
      ))}
    </Space>
  );
}

function ActionTypeFields({
  action,
  actionIndex,
  onPatch,
  onPickAppearEntityPos,
  appearPickHint
}: {
  action: StoryAction;
  actionIndex: number;
  onPatch: (a: StoryAction) => void;
  onPickAppearEntityPos?: (actionIndex: number, entityIndex: number) => void;
  appearPickHint?: string;
}) {
  const t = action.type;
  if (t === 'chat') {
    const lines = (Array.isArray(action.content) ? action.content : []) as ChatContentLine[];
    const setLines = (next: ChatContentLine[]) => {
      onPatch({ ...action, type: 'chat', content: next });
    };
    const addLine = () => setLines([...lines, { name: '', content: '' }]);
    const setLine = (idx: number, patch: Record<string, unknown>) => {
      const cur = lines[idx];
      let merged: ChatContentLine;
      if (typeof cur === 'string') {
        merged = { content: (patch.content as string) ?? cur, ...patch } as ChatContentLine;
      } else {
        merged = { ...(cur as Record<string, unknown>), ...patch } as ChatContentLine;
      }
      const next = [...lines];
      next[idx] = merged;
      setLines(next);
    };
    const removeLine = (idx: number) => setLines(lines.filter((_, j) => j !== idx));

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button size="small" type="dashed" onClick={addLine}>
          添加一句
        </Button>
        {lines.map((line, idx) => (
          <Card key={idx} size="small" type="inner" title={`第 ${idx + 1} 句`} extra={<Button type="link" danger size="small" onClick={() => removeLine(idx)}>删除</Button>}>
            {typeof line === 'string' ? (
              <Input.TextArea rows={2} value={line} onChange={(e) => setLine(idx, { content: e.target.value })} />
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ color: '#999', fontSize: 12 }}>姓名 name</div>
                  <Input
                    value={String(line.name ?? '')}
                    onChange={(e) => setLine(idx, { name: e.target.value })}
                  />
                </div>
                <div>
                  <div style={{ color: '#999', fontSize: 12 }}>内容 content</div>
                  <Input.TextArea
                    rows={3}
                    value={Array.isArray(line.content) ? line.content.join('\n') : String(line.content ?? '')}
                    onChange={(e) => setLine(idx, { content: e.target.value })}
                  />
                </div>
              </>
            )}
          </Card>
        ))}
      </Space>
    );
  }

  if (t === 'playSound') {
    return (
      <div>
        <div style={{ marginBottom: 4, color: '#999' }}>sound 路径</div>
        <Input
          value={String(action.sound ?? '')}
          onChange={(e) => onPatch({ ...action, type: 'playSound', sound: e.target.value })}
          placeholder="如 sound/level3Event.mp3"
        />
      </div>
    );
  }

  if (t === 'screenFade') {
    return (
      <div>
        <div style={{ marginBottom: 4, color: '#999' }}>animationType</div>
        <Input
          value={String(action.animationType ?? '')}
          onChange={(e) => onPatch({ ...action, type: 'screenFade', animationType: e.target.value })}
          placeholder="fadeIn / fadeOut / in / out"
        />
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 4, color: '#999' }}>duration（秒，可选）</div>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={0.1}
            value={typeof action.duration === 'number' ? action.duration : undefined}
            onChange={(v) =>
              onPatch({
                ...action,
                type: 'screenFade',
                duration: v === null ? undefined : Number(v)
              })
            }
          />
        </div>
      </div>
    );
  }

  if (t === 'changeFloor') {
    const playerPos = action.playerPos as StoryPos | undefined;
    return (
      <div>
        <div style={{ marginBottom: 4, color: '#999' }}>目标楼层 floor</div>
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          value={typeof action.floor === 'number' ? action.floor : 1}
          onChange={(v) => onPatch({ ...action, type: 'changeFloor', floor: Number(v) || 1 })}
        />
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 4, color: '#999' }}>玩家位置 playerPos（可选；x,y 或数字）</div>
          <Input
            value={
              typeof playerPos === 'object' && playerPos && 'x' in playerPos
                ? `${playerPos.x},${playerPos.y}`
                : playerPos !== undefined && playerPos !== null
                  ? String(playerPos)
                  : ''
            }
            onChange={(e) => {
              const v = e.target.value.trim();
              onPatch({
                ...action,
                type: 'changeFloor',
                playerPos: v ? v : undefined
              });
            }}
            placeholder="如 6,7 或 42"
          />
        </div>
      </div>
    );
  }

  if (t === 'runEvent') {
    const id = action.eventId ?? action.id;
    return (
      <div>
        <div style={{ marginBottom: 4, color: '#999' }}>eventId</div>
        <Input
          value={id !== undefined && id !== null ? String(id) : ''}
          onChange={(e) =>
            onPatch({ ...action, type: 'runEvent', eventId: e.target.value, id: undefined })
          }
        />
      </div>
    );
  }

  if (t === 'giveItem') {
    const raw = (action.items ?? action.itemIds ?? []) as unknown[];
    const text = raw.map(x => String(x)).join(', ');
    return (
      <div>
        <div style={{ marginBottom: 4, color: '#999' }}>items（逗号分隔，对应 prop 名）</div>
        <Input
          value={text}
          onChange={(e) => {
            const items = e.target.value
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            onPatch({ ...action, type: 'giveItem', items, itemIds: undefined });
          }}
        />
      </div>
    );
  }

  if (t === 'changePlayerState') {
    return <ChangePlayerStateEditor action={action} onPatch={onPatch} />;
  }

  if (t === 'appear') {
    const entities = (Array.isArray(action.entities) ? action.entities : []) as AppearEntity[];
    const setEntities = (next: AppearEntity[]) => {
      onPatch({ ...action, type: 'appear', entities: next });
    };
    const addEnt = () => setEntities([...entities, { type: 'monster', name: '100', pos: '1,1' }]);
    const patchEnt = (ei: number, e: AppearEntity) => {
      const next = [...entities];
      next[ei] = e;
      setEntities(next);
    };
    const removeEnt = (ei: number) => setEntities(entities.filter((_, j) => j !== ei));

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>animationType（可选）</div>
          <Input
            value={String(action.animationType ?? '')}
            onChange={(e) => onPatch({ ...action, type: 'appear', animationType: e.target.value || undefined })}
          />
        </div>
        <Button size="small" type="dashed" onClick={addEnt}>
          添加实体
        </Button>
        {entities.map((ent, ei) => (
          <Card
            key={ei}
            size="small"
            title={`实体 ${ei + 1}`}
            extra={
              <Space>
                {onPickAppearEntityPos && (
                  <Button size="small" onClick={() => onPickAppearEntityPos(actionIndex, ei)}>
                    {appearPickHint ?? '地图选格'}
                  </Button>
                )}
                <Button size="small" danger type="link" onClick={() => removeEnt(ei)}>删除</Button>
              </Space>
            }
          >
            <Select
              style={{ width: '100%', marginBottom: 8 }}
              value={ent.type}
              options={[
                { value: 'player', label: 'player' },
                { value: 'npc', label: 'npc' },
                { value: 'monster', label: 'monster' },
                { value: 'item', label: 'item' }
              ]}
              onChange={(v) => patchEnt(ei, { ...ent, type: v as AppearEntity['type'] })}
            />
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#999', fontSize: 12 }}>pos（x,y 或数字）</div>
              <Input
                value={
                  typeof ent.pos === 'object' && ent.pos && 'x' in ent.pos
                    ? `${ent.pos.x},${ent.pos.y}`
                    : ent.pos !== undefined && ent.pos !== null
                      ? String(ent.pos)
                      : ''
                }
                onChange={(e) => patchEnt(ei, { ...ent, pos: e.target.value })}
              />
            </div>
            <div>
              <div style={{ color: '#999', fontSize: 12 }}>name</div>
              {ent.type === 'monster' ? (
                <Select
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="label"
                  value={ent.name !== undefined && ent.name !== null ? String(ent.name) : undefined}
                  options={MONSTER_NAME_OPTIONS}
                  onChange={(v) => patchEnt(ei, { ...ent, name: v })}
                  placeholder="选择怪物（name）"
                />
              ) : ent.type === 'item' ? (
                <Select
                  style={{ width: '100%' }}
                  showSearch
                  optionFilterProp="label"
                  value={ent.name !== undefined && ent.name !== null ? String(ent.name) : undefined}
                  options={ITEM_NAME_OPTIONS}
                  onChange={(v) => patchEnt(ei, { ...ent, name: v })}
                  placeholder="选择道具（name）"
                />
              ) : (
                <Input
                  value={String(ent.name ?? '')}
                  onChange={(e) => patchEnt(ei, { ...ent, name: e.target.value })}
                />
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ color: '#999', fontSize: 12 }}>delay（毫秒）</div>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                value={ent.delay}
                onChange={(v) => patchEnt(ei, { ...ent, delay: v === null ? undefined : Number(v) })}
              />
            </div>
          </Card>
        ))}
      </Space>
    );
  }

  if (t === 'move') {
    const entity = action.entity;
    const entityKind =
      entity === 'player'
        ? 'player'
        : entity && typeof entity === 'object' && !Array.isArray(entity) && 'type' in entity
          ? String((entity as { type?: unknown }).type)
          : 'player';
    const npcId =
      entity && typeof entity === 'object' && !Array.isArray(entity)
        ? String((entity as { npcId?: unknown; id?: unknown }).npcId ?? (entity as { id?: unknown }).id ?? '')
        : '';
    const setEntityKind = (kind: 'player' | 'npc') => {
      if (kind === 'player') {
        onPatch({ ...action, type: 'move', entity: 'player' });
      } else {
        onPatch({ ...action, type: 'move', entity: { type: 'npc', npcId: npcId || 'wise' } });
      }
    };
    const setNpcId = (next: string) => {
      onPatch({ ...action, type: 'move', entity: { type: 'npc', npcId: next } });
    };
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>entity</div>
          <Select
            style={{ width: '100%' }}
            value={entityKind === 'npc' ? 'npc' : 'player'}
            options={[
              { value: 'player', label: 'player' },
              { value: 'npc', label: 'npc' }
            ]}
            onChange={(v) => setEntityKind(v as 'player' | 'npc')}
          />
        </div>
        {entityKind === 'npc' && (
          <div>
            <div style={{ marginBottom: 4, color: '#999' }}>npcId（或旧字段 id）</div>
            <Input value={npcId} onChange={(e) => setNpcId(e.target.value)} placeholder="如 wise" />
          </div>
        )}
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>from（可选；x,y 或数字）</div>
          <Input
            value={action.from !== undefined && action.from !== null ? String(action.from) : ''}
            onChange={(e) =>
              onPatch({
                ...action,
                type: 'move',
                from: e.target.value.trim() ? e.target.value.trim() : undefined
              })
            }
            placeholder="留空=用实体当前格"
          />
        </div>
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>to（必填；x,y 或数字）</div>
          <Input
            value={action.to !== undefined && action.to !== null ? String(action.to) : ''}
            onChange={(e) => onPatch({ ...action, type: 'move', to: e.target.value.trim() })}
            placeholder="如 5,1"
          />
        </div>
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>stepMs（可选，默认 120）</div>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={typeof action.stepMs === 'number' ? action.stepMs : undefined}
            onChange={(v) =>
              onPatch({ ...action, type: 'move', stepMs: v === null ? undefined : Number(v) })
            }
          />
        </div>
      </Space>
    );
  }

  if (t === 'removeTile') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>pos（必填；x,y 或数字）</div>
          <Input
            value={action.pos !== undefined && action.pos !== null ? String(action.pos) : ''}
            onChange={(e) => onPatch({ ...action, type: 'removeTile', pos: e.target.value.trim() })}
            placeholder="如 3,4"
          />
        </div>
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>kind（可选）</div>
          <Select
            style={{ width: '100%' }}
            allowClear
            value={typeof action.kind === 'string' && action.kind.trim() ? action.kind : undefined}
            options={[
              { value: 'npc', label: 'npc' },
              { value: 'monster', label: 'monster' },
              { value: 'item', label: 'item' },
              { value: 'terrain', label: 'terrain' },
              { value: 'gate', label: 'gate' }
            ]}
            onChange={(v) => onPatch({ ...action, type: 'removeTile', kind: v ?? undefined })}
            placeholder="按 tile.type 过滤"
          />
        </div>
        <div>
          <div style={{ marginBottom: 4, color: '#999' }}>name（可选）</div>
          <Input
            value={typeof action.name === 'string' ? action.name : ''}
            onChange={(e) =>
              onPatch({
                ...action,
                type: 'removeTile',
                name: e.target.value.trim() ? e.target.value.trim() : undefined
              })
            }
            placeholder='按 tile.name 过滤，如 wall / 100 / yellowkey'
          />
        </div>
      </Space>
    );
  }

  /* placeholders: raw JSON */
  if (isPlaceholderActionType(String(t))) {
    const raw = JSON.stringify(
      Object.fromEntries(Object.entries(action).filter(([k]) => k !== 'type' && k !== 'delay')),
      null,
      2
    );
    return (
      <div>
        <div style={{ marginBottom: 4, color: '#999' }}>附加字段（JSON 对象）</div>
        <Input.TextArea
          rows={4}
          value={raw === '{}' ? '' : raw}
          onChange={(e) => {
            const v = e.target.value.trim();
            const base: StoryAction = { type: action.type, delay: action.delay };
            if (!v) {
              onPatch(base);
              return;
            }
            try {
              const obj = JSON.parse(v) as Record<string, unknown>;
              onPatch({ ...base, ...obj, type: action.type, delay: action.delay });
            } catch {
              /* ignore */
            }
          }}
        />
      </div>
    );
  }

  return (
    <Text type="secondary">未知动作类型，请用 JSON 导出后手改或后续扩展编辑器。</Text>
  );
}

function ChangePlayerStateEditor({
  action,
  onPatch
}: {
  action: StoryAction;
  onPatch: (a: StoryAction) => void;
}) {
  const changes =
    action.changes && typeof action.changes === 'object' && !Array.isArray(action.changes)
      ? (action.changes as Record<string, number>)
      : {};
  const [text, setText] = useState(() =>
    Object.keys(changes).length ? JSON.stringify(changes, null, 2) : ''
  );

  return (
    <div>
      <div style={{ marginBottom: 4, color: '#999' }}>changes（JSON 对象，数值为累加；失焦时校验）</div>
      <Input.TextArea
        rows={6}
        value={text}
        placeholder='{"hp":10,"gold":100}'
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const v = text.trim();
          if (!v) {
            onPatch({ ...action, type: 'changePlayerState', changes: {} });
            return;
          }
          try {
            const obj = JSON.parse(v) as Record<string, number>;
            if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
              throw new Error('须为对象');
            }
            onPatch({ ...action, type: 'changePlayerState', changes: obj });
          } catch {
            const c =
              action.changes &&
              typeof action.changes === 'object' &&
              !Array.isArray(action.changes)
                ? (action.changes as Record<string, number>)
                : {};
            setText(Object.keys(c).length ? JSON.stringify(c, null, 2) : '');
          }
        }}
      />
    </div>
  );
}
