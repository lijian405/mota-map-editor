import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Typography,
  Upload,
  message
} from 'antd';
import { PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RcFile } from 'antd/es/upload';
import { saveAs } from 'file-saver';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addStory,
  duplicateStoryAt,
  removeStoryAt,
  setSelectedFlowFocus,
  setSelectedStoryIndex,
  setStoryDocument,
  setStoryDirty,
  updateStoryAt,
  updateStoryGraphPositions
} from '../../store/storySlice';
import type { Story, TriggerType } from '../../types/story';
import { parseStoryJson, serializeStoryRoot } from '../../utils/storyJson';
import { validateStoryDocument, summarizeTrigger } from '../../utils/storyValidation';
import { extractEventKeys, extractPropNames } from '../../utils/refDataJson';
import StoryDetailForm from './StoryDetailForm';
import StoryFlowCanvas from './StoryFlowCanvas';

const { Text, Paragraph } = Typography;

function defaultStory(): Story {
  return {
    id: `story_${Date.now()}`,
    desc: '',
    repeatable: false,
    order: 0,
    trigger: { type: 'floor_enter', floor: 1 },
    actions: []
  };
}

export default function StoryWorkspace() {
  const dispatch = useAppDispatch();
  const document = useAppSelector(s => s.story.document);
  const fileName = useAppSelector(s => s.story.fileName);
  const dirty = useAppSelector(s => s.story.dirty);
  const selectedIndex = useAppSelector(s => s.story.selectedIndex);
  const selectedFlowFocus = useAppSelector(s => s.story.selectedFlowFocus);
  const mapData = useAppSelector(s => s.map.mapData);
  const selectedTileId = useAppSelector(s => s.map.selectedTileId);
  const selectedGrid = useAppSelector(s => s.map.selectedGrid);

  const [filterTriggerType, setFilterTriggerType] = useState<TriggerType | 'all'>('all');
  const [filterFloor, setFilterFloor] = useState<number | null>(null);
  const [filterNpcOrTile, setFilterNpcOrTile] = useState('');

  const [eventKeys, setEventKeys] = useState<string[] | null>(null);
  const [propNames, setPropNames] = useState<string[] | null>(null);
  const [editorModalOpen, setEditorModalOpen] = useState(false);

  const openStoryEditor = (index: number) => {
    dispatch(setSelectedStoryIndex(index));
    setEditorModalOpen(true);
  };

  const closeStoryEditor = () => {
    setEditorModalOpen(false);
  };

  const stories = document?.stories ?? [];

  const filteredStories = useMemo(() => {
    return stories
      .map((st, idx) => ({ st, idx }))
      .filter(({ st }) => {
        const tr = st.trigger;
        if (filterTriggerType !== 'all' && tr.type !== filterTriggerType) return false;

        if (filterFloor !== null) {
          let involves = false;
          if (tr.type === 'floor_enter' || tr.type === 'tile_enter' || tr.type === 'monsters_defeated') {
            involves = tr.floor === filterFloor;
          } else if (tr.type === 'npc_interact') {
            involves = tr.floor === undefined || tr.floor === filterFloor;
          }
          if (!involves) return false;
        }

        if (filterNpcOrTile.trim()) {
          const q = filterNpcOrTile.trim().toLowerCase();
          let hit =
            String(st.id).toLowerCase().includes(q) || !!(st.desc && st.desc.toLowerCase().includes(q));
          if (tr.type === 'npc_interact') hit = hit || String(tr.npc).toLowerCase().includes(q);
          if (tr.type === 'tile_enter') hit = hit || String(tr.tile).toLowerCase().includes(q);
          if (!hit) return false;
        }
        return true;
      });
  }, [stories, filterTriggerType, filterFloor, filterNpcOrTile]);

  const validation = useMemo(() => {
    if (!document) return { errors: [], warnings: [] };
    return validateStoryDocument(document, {
      eventJsonKeys: eventKeys ?? undefined,
      propJsonNames: propNames ?? undefined
    });
  }, [document, eventKeys, propNames]);

  const selectedStory =
    selectedIndex !== null && selectedIndex >= 0 && selectedIndex < stories.length
      ? stories[selectedIndex]
      : null;

  const handleImportStory = (file: RcFile) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const doc = parseStoryJson(text);
        setEditorModalOpen(false);
        dispatch(
          setStoryDocument({
            document: doc,
            fileName: file.name,
            dirty: false
          })
        );
        message.success('剧情文件已加载');
      } catch (e) {
        message.error(e instanceof Error ? e.message : '解析失败');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleExportStory = () => {
    if (!document) return;
    const name = fileName?.replace(/\.json$/i, '') || 'story';
    saveAs(new Blob([serializeStoryRoot(document)], { type: 'application/json;charset=utf-8' }), `${name}.json`);
    dispatch(setStoryDirty(false));
    message.success('已导出（请放入游戏 map_data/story.json）');
  };

  const handleNewDocument = () => {
    setEditorModalOpen(false);
    dispatch(
      setStoryDocument({
        document: { stories: [] },
        fileName: null,
        dirty: true
      })
    );
  };

  const columns: ColumnsType<{ st: Story; idx: number }> = [
    {
      title: 'id',
      dataIndex: ['st', 'id'],
      render: (_, r) => String(r.st.id),
      width: 140,
      ellipsis: true
    },
    {
      title: 'desc',
      dataIndex: ['st', 'desc'],
      ellipsis: true
    },
    {
      title: '触发',
      render: (_, r) => summarizeTrigger(r.st.trigger),
      ellipsis: true
    },
    {
      title: 'repeat',
      width: 72,
      render: (_, r) => (r.st.repeatable ? '是' : '否')
    },
    {
      title: 'order',
      width: 64,
      render: (_, r) => r.st.order ?? 0
    },
    {
      title: '操作',
      width: 200,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openStoryEditor(r.idx)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => dispatch(duplicateStoryAt(r.idx))}
          >
            复制
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => dispatch(removeStoryAt(r.idx))}
          >
            删
          </Button>
        </Space>
      )
    }
  ];

  if (!document) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Empty description="尚未加载剧情文件">
          <Space>
            <Upload beforeUpload={handleImportStory} showUploadList={false} accept=".json">
              <Button type="primary">打开 story.json</Button>
            </Upload>
            <Button onClick={handleNewDocument}>新建空剧情表</Button>
          </Space>
          <Paragraph type="secondary" style={{ marginTop: 24, maxWidth: 480, margin: '24px auto 0' }}>
            游戏内权威路径一般为 <Text code>map_data/story.json</Text>。可导入{' '}
            <Text code>docs/story.json</Text> 作为示例。
          </Paragraph>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #333', flexShrink: 0 }}>
        <Space wrap>
          <Upload beforeUpload={handleImportStory} showUploadList={false} accept=".json">
            <Button>打开剧情 JSON</Button>
          </Upload>
          <Button type="primary" onClick={handleExportStory} disabled={!document}>
            导出 story.json
          </Button>
          <Button onClick={handleNewDocument}>清空并新建</Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => {
              dispatch(addStory(defaultStory()));
              setEditorModalOpen(true);
            }}
          >
            新增剧情
          </Button>
          {dirty && <Text type="warning">未导出</Text>}
          <Text type="secondary">{fileName ?? '未命名'}</Text>
        </Space>
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            <Text type="secondary">引用校验（可选）：</Text>
            <Upload
              beforeUpload={(file) => {
                const r = new FileReader();
                r.onload = () => {
                  try {
                    const o = JSON.parse(String(r.result ?? ''));
                    setEventKeys(extractEventKeys(o));
                    message.success('已加载 event.json 键列表');
                  } catch {
                    message.error('event.json 解析失败');
                  }
                };
                r.readAsText(file as RcFile);
                return false;
              }}
              showUploadList={false}
              accept=".json"
            >
              <Button size="small">加载 event.json</Button>
            </Upload>
            <Upload
              beforeUpload={(file) => {
                const r = new FileReader();
                r.onload = () => {
                  try {
                    const o = JSON.parse(String(r.result ?? ''));
                    setPropNames(extractPropNames(o));
                    message.success('已加载 prop 列表');
                  } catch {
                    message.error('prop.json 解析失败');
                  }
                };
                r.readAsText(file as RcFile);
                return false;
              }}
              showUploadList={false}
              accept=".json"
            >
              <Button size="small">加载 prop.json</Button>
            </Upload>
            {(eventKeys || propNames) && (
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setEventKeys(null);
                  setPropNames(null);
                }}
              >
                清除引用
              </Button>
            )}
          </Space>
        </div>
      </div>

      {validation.errors.length > 0 && (
        <Alert
          type="error"
          showIcon
          style={{ margin: '8px 16px 0', flexShrink: 0 }}
          message={`校验错误 ${validation.errors.length} 条`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 120, overflow: 'auto' }}>
              {validation.errors.slice(0, 20).map((e, i) => (
                <li key={i}>
                  <Text code>{e.path}</Text> {e.message}
                </li>
              ))}
            </ul>
          }
        />
      )}
      {validation.warnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ margin: '8px 16px 0', flexShrink: 0 }}
          message={`提示 ${validation.warnings.length} 条`}
          description={
            <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 100, overflow: 'auto' }}>
              {validation.warnings.slice(0, 15).map((e, i) => (
                <li key={i}>{e.message}</li>
              ))}
            </ul>
          }
        />
      )}

      <Row style={{ flex: 1, minHeight: 0, margin: 0 }}>
        <Col span={24} style={{ padding: 12, overflow: 'auto', height: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card size="small" title="筛选">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  style={{ width: '100%' }}
                  value={filterTriggerType}
                  onChange={setFilterTriggerType}
                  options={[
                    { value: 'all', label: '全部触发类型' },
                    { value: 'floor_enter', label: 'floor_enter' },
                    { value: 'tile_enter', label: 'tile_enter' },
                    { value: 'npc_interact', label: 'npc_interact' },
                    { value: 'monsters_defeated', label: 'monsters_defeated' }
                  ]}
                />
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="楼层筛选（空=不限）"
                  min={1}
                  value={filterFloor ?? undefined}
                  onChange={(v) => setFilterFloor(v == null || v === undefined ? null : Number(v))}
                  changeOnWheel={false}
                />
                <Input
                  placeholder="NPC / 格子关键字"
                  value={filterNpcOrTile}
                  onChange={(e) => setFilterNpcOrTile(e.target.value)}
                />
              </Space>
            </Card>
            <Table
              size="small"
              rowKey={r => r.idx}
              columns={columns}
              dataSource={filteredStories}
              pagination={{ pageSize: 16, size: 'small' }}
              onRow={record => ({
                onClick: () => openStoryEditor(record.idx),
                style: {
                  cursor: 'pointer',
                  background: record.idx === selectedIndex ? 'rgba(24,144,255,0.15)' : undefined
                }
              })}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              点击表格行或「编辑」打开大窗口：左侧流程图，右侧表单。
            </Text>
          </Space>
        </Col>
      </Row>

      <Modal
        title={
          selectedStory && selectedIndex !== null
            ? `编辑剧情 — ${String(selectedStory.id)}`
            : '编辑剧情'
        }
        open={editorModalOpen && !!selectedStory && selectedIndex !== null}
        onCancel={closeStoryEditor}
        footer={
          <Button type="primary" onClick={closeStoryEditor}>
            关闭
          </Button>
        }
        width="96vw"
        style={{ top: 24, maxWidth: 1680 }}
        styles={{
          body: { padding: 0, background: '#0d1117' }
        }}
        destroyOnClose={false}
        maskClosable
      >
        {selectedStory && selectedIndex !== null && (
          <div
            style={{
              display: 'flex',
              height: 'calc(100vh - 200px)',
              minHeight: 520,
              maxHeight: 900
            }}
          >
            <div
              style={{
                flex: '1 1 50%',
                minWidth: 280,
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #303030'
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid #303030',
                  color: '#8b949e',
                  fontSize: 12,
                  flexShrink: 0
                }}
              >
                流程图：连线为执行顺序；拖动节点仅改布局（写入 _storyGraph）。
              </div>
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <StoryFlowCanvas
                  story={selectedStory}
                  storyIndex={selectedIndex}
                  positions={document._storyGraph?.positions}
                  flowFocus={selectedFlowFocus}
                  onFlowFocus={(f) => dispatch(setSelectedFlowFocus(f))}
                  onPositionsCommit={(u) => dispatch(updateStoryGraphPositions(u))}
                />
              </div>
            </div>
            <div
              style={{
                flex: '1 1 50%',
                minWidth: 320,
                overflow: 'auto',
                padding: 16,
                background: '#001529'
              }}
            >
              <StoryDetailForm
                key={selectedIndex}
                story={selectedStory}
                onChange={(s) => dispatch(updateStoryAt({ index: selectedIndex, story: s }))}
                mapData={mapData}
                selectedTileId={selectedTileId}
                selectedGrid={selectedGrid}
                selectedFlowFocus={selectedFlowFocus}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
