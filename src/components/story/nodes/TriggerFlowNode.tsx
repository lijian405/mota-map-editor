import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { StoryTrigger } from '../../../types/story';
import { summarizeTrigger } from '../../../utils/storyValidation';

export type TriggerFlowNodeData = {
  storyIndex: number;
  summary: StoryTrigger;
};

export default function TriggerFlowNode({ data, selected }: NodeProps) {
  const d = data as TriggerFlowNodeData;
  return (
    <div
      style={{
        padding: '8px 12px',
        minWidth: 160,
        maxWidth: 240,
        border: selected ? '2px solid #1890ff' : '1px solid #434343',
        borderRadius: 8,
        background: '#141414',
        color: '#fff',
        fontSize: 12
      }}
    >
      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>触发器</div>
      <div style={{ lineHeight: 1.4 }}>{summarizeTrigger(d.summary)}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
