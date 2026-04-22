import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StoryAction } from '../../../types/story';
import { isPlaceholderActionType } from '../../../types/story';
import { summarizeAction } from '../../../utils/storyFlowAdapter';

export type ActionFlowNodeData = {
  storyIndex: number;
  actionIndex: number;
  action: StoryAction;
};

export default function ActionFlowNode({ data, selected }: NodeProps) {
  const d = data as ActionFlowNodeData;
  const ph = isPlaceholderActionType(String(d.action?.type));
  return (
    <div
      style={{
        padding: '8px 12px',
        minWidth: 160,
        maxWidth: 260,
        border: selected ? '2px solid #1890ff' : '1px solid #434343',
        borderRadius: 8,
        background: ph ? '#1a1510' : '#141414',
        color: '#fff',
        fontSize: 12
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: 10, color: ph ? '#fa8c16' : '#888', marginBottom: 4 }}>
        {String(d.action?.type ?? '—')}
        {ph ? '（占位）' : ''}
      </div>
      <div style={{ lineHeight: 1.4, opacity: 0.95 }}>{summarizeAction(d.action)}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
