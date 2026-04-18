import type { ReactNode } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Form, Select, Input, InputNumber, Button, Space, Divider } from 'antd';
import type { GameEvent, TriggerType, BumpDirection } from '../../types';
import {
  triggerOptions,
  conditionOptions,
  actionOptions,
  bumpDirectionOptions,
  conditionLogicOptions
} from './eventEditorOptions';

export type EventDraft = Partial<GameEvent>;

function JsonParamsField({
  params,
  onCommit,
  placeholder
}: {
  params: Record<string, unknown> | undefined;
  onCommit: (p: Record<string, unknown>) => void;
  placeholder?: string;
}) {
  const serialized = JSON.stringify(params ?? {});
  const [text, setText] = useState(serialized);
  const editingRef = useRef(false);

  useEffect(() => {
    if (!editingRef.current) {
      setText(serialized);
    }
  }, [serialized]);

  return (
    <Input
      placeholder={placeholder}
      value={text}
      onFocus={() => {
        editingRef.current = true;
      }}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        try {
          const parsed = JSON.parse(v) as unknown;
          if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
            onCommit(parsed as Record<string, unknown>);
          }
        } catch {
          /* 输入过程中 JSON 可能不完整 */
        }
      }}
      onBlur={() => {
        editingRef.current = false;
        try {
          const parsed = JSON.parse(text) as unknown;
          onCommit(
            parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
              ? (parsed as Record<string, unknown>)
              : {}
          );
        } catch {
          setText(serialized);
        }
      }}
    />
  );
}

interface EventEditorFormProps {
  value: EventDraft;
  onChange: (next: EventDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  /** 与 Tile 事件面板一致时显示「后续事件」 */
  showNextEventField?: boolean;
  /** 触发器下拉框标签（全局事件面板沿用原文案） */
  triggerFieldLabel?: string;
  /** 表单前可选标题区，例如瓦片面板的「编辑事件」分隔线 */
  header?: ReactNode;
}

const EventEditorForm = ({
  value: currentEvent,
  onChange,
  onSave,
  onCancel,
  showNextEventField = false,
  triggerFieldLabel = '触发方式',
  header
}: EventEditorFormProps) => {
  const handleAddCondition = () => {
    onChange({
      ...currentEvent,
      conditions: [...(currentEvent.conditions || []), { type: 'has_item', params: {} }]
    });
  };

  const handleAddAction = () => {
    onChange({
      ...currentEvent,
      actions: [...(currentEvent.actions || []), { type: 'get_item', params: {} }]
    });
  };

  const handleConditionChange = (index: number, field: string, val: unknown) => {
    if (!currentEvent.conditions) return;
    const newConditions = [...currentEvent.conditions];
    newConditions[index] = { ...newConditions[index], [field]: val };
    onChange({ ...currentEvent, conditions: newConditions });
  };

  const handleActionChange = (index: number, field: string, val: unknown) => {
    if (!currentEvent.actions) return;
    const newActions = [...currentEvent.actions];
    newActions[index] = { ...newActions[index], [field]: val };
    onChange({ ...currentEvent, actions: newActions });
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      {header}
      <Form layout="vertical" size="small">
        <Form.Item label="事件ID">
          <Input
            value={currentEvent.eventId || ''}
            onChange={(e) => onChange({ ...currentEvent, eventId: e.target.value })}
          />
        </Form.Item>

        <Form.Item label={triggerFieldLabel}>
          <Select
            value={currentEvent.trigger?.type || 'step_on_tile'}
            onChange={(v) =>
              onChange({
                ...currentEvent,
                trigger: { type: v as TriggerType, params: v === 'bump_tile' ? { direction: 'any' } : undefined }
              })
            }
            options={triggerOptions}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {currentEvent.trigger?.type === 'bump_tile' && (
          <Form.Item label="碰撞方向">
            <Select
              value={(currentEvent.trigger.params as { direction?: BumpDirection })?.direction || 'any'}
              onChange={(v) => {
                if (currentEvent.trigger) {
                  onChange({
                    ...currentEvent,
                    trigger: {
                      type: currentEvent.trigger.type,
                      params: { direction: v } as { direction: BumpDirection }
                    }
                  });
                }
              }}
              options={bumpDirectionOptions}
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        <Divider>执行条件</Divider>

        <Form.Item label="条件逻辑">
          <Select
            value={currentEvent.conditionLogic || 'and'}
            onChange={(v) => onChange({ ...currentEvent, conditionLogic: v })}
            options={conditionLogicOptions}
            style={{ width: '100%' }}
          />
        </Form.Item>

        {currentEvent.conditions?.map((cond, index) => (
          <Form.Item key={index} label={`条件 ${index + 1}`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                value={cond.type}
                onChange={(v) => handleConditionChange(index, 'type', v)}
                options={conditionOptions}
                style={{ width: '100%' }}
              />
              <JsonParamsField
                placeholder="条件参数 (JSON)"
                params={cond.params as Record<string, unknown> | undefined}
                onCommit={(p) => handleConditionChange(index, 'params', p)}
              />
              <Button
                size="small"
                danger
                onClick={() => {
                  const newConditions = currentEvent.conditions?.filter((_, i) => i !== index);
                  onChange({ ...currentEvent, conditions: newConditions });
                }}
              >
                删除条件
              </Button>
            </Space>
          </Form.Item>
        ))}

        <Button type="dashed" onClick={handleAddCondition} block style={{ marginBottom: 16 }}>
          添加条件
        </Button>

        <Form.Item label="条件不满足提示">
          <Input.TextArea
            value={currentEvent.conditionFailText || ''}
            onChange={(e) => onChange({ ...currentEvent, conditionFailText: e.target.value })}
            rows={2}
          />
        </Form.Item>

        <Divider>动作序列</Divider>

        {currentEvent.actions?.map((action, index) => (
          <Form.Item key={index} label={`动作 ${index + 1}`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                value={action.type}
                onChange={(v) => handleActionChange(index, 'type', v)}
                options={actionOptions}
                style={{ width: '100%' }}
              />
              <JsonParamsField
                placeholder="动作参数 (JSON)"
                params={action.params as Record<string, unknown> | undefined}
                onCommit={(p) => handleActionChange(index, 'params', p)}
              />
              <InputNumber
                placeholder="延迟 (毫秒)"
                value={action.delay || 0}
                onChange={(v) => handleActionChange(index, 'delay', v)}
                style={{ width: '100%' }}
              />
              <Button
                size="small"
                danger
                onClick={() => {
                  const newActions = currentEvent.actions?.filter((_, i) => i !== index);
                  onChange({ ...currentEvent, actions: newActions });
                }}
              >
                删除动作
              </Button>
            </Space>
          </Form.Item>
        ))}

        <Button type="dashed" onClick={handleAddAction} block style={{ marginBottom: 16 }}>
          添加动作
        </Button>

        {showNextEventField && (
          <Form.Item label="后续事件ID">
            <Input
              value={currentEvent.nextEvent || ''}
              onChange={(e) => onChange({ ...currentEvent, nextEvent: e.target.value })}
              placeholder="可选：触发完成后链式触发的事件ID"
            />
          </Form.Item>
        )}

        <Divider />

        <Space>
          <Button type="primary" onClick={onSave}>
            保存事件
          </Button>
          <Button onClick={onCancel}>取消</Button>
        </Space>
      </Form>
    </div>
  );
};

export default EventEditorForm;
