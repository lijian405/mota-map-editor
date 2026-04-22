import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Node,
  type NodeTypes
} from '@xyflow/react';
import type { Story } from '../../types/story';
import { buildFlowElements, type StoryFlowFocus } from '../../utils/storyFlowAdapter';
import ActionFlowNode from './nodes/ActionFlowNode';
import TriggerFlowNode from './nodes/TriggerFlowNode';

const nodeTypes = {
  trigger: TriggerFlowNode,
  action: ActionFlowNode
} as NodeTypes;

function parseNodeClick(id: string): StoryFlowFocus {
  if (id.startsWith('t:')) return { kind: 'trigger' };
  const m = /^a:\d+:(\d+)$/.exec(id);
  if (m) return { kind: 'action', index: parseInt(m[1], 10) };
  return null;
}

type StoryFlowCanvasInnerProps = {
  story: Story;
  storyIndex: number;
  positions: Record<string, { x: number; y: number }> | undefined;
  flowFocus: StoryFlowFocus;
  onFlowFocus: (f: StoryFlowFocus) => void;
  onPositionsCommit: (updates: Record<string, { x: number; y: number }>) => void;
};

function StoryFlowCanvasInner({
  story,
  storyIndex,
  positions,
  flowFocus,
  onFlowFocus,
  onPositionsCommit
}: StoryFlowCanvasInnerProps) {
  const { fitView } = useReactFlow();

  const built = useMemo(
    () => buildFlowElements(story, storyIndex, positions, flowFocus),
    [story, storyIndex, positions, flowFocus]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(built.edges);

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built, setNodes, setEdges]);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      fitView({ padding: 0.15, duration: 150 });
    });
    return () => cancelAnimationFrame(t);
  }, [storyIndex, fitView]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onPositionsCommit({ [node.id]: { x: node.position.x, y: node.position.y } });
    },
    [onPositionsCommit]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onFlowFocus(parseNodeClick(node.id));
    },
    [onFlowFocus]
  );

  return (
    <div className="story-flow-canvas" style={{ width: '100%', height: '100%', minHeight: 320 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        edgesReconnectable={false}
        edgesFocusable={false}
        deleteKeyCode={null}
        multiSelectionKeyCode={null}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" />
      </ReactFlow>
    </div>
  );
}

export type StoryFlowCanvasProps = StoryFlowCanvasInnerProps;

export default function StoryFlowCanvas(props: StoryFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <StoryFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
