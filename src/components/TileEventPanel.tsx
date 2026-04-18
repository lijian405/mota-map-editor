import { useState, useEffect } from 'react';
import { Drawer, Button, Space, Divider, List, Tag, Empty, message } from 'antd';
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { EventTemplate } from '../data/eventTemplates';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addTileEvent, removeTileEvent } from '../store/mapSlice';
import { setTileEventPanelOpen } from '../store/editorSlice';
import type { TileEvent, Floor, Tile } from '../types';
import { EventEditorForm, EventTemplateModal, triggerLabelMap, type EventDraft } from './eventEditor';

const TileEventPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const open = useAppSelector(state => state.editor.tileEventPanelOpen);
  const editingTileId = useAppSelector(state => state.editor.editingTileId);
  const mapData = useAppSelector(state => state.map.mapData);
  const currentFloor = mapData.floors.find((f: Floor) => f.floorId === mapData.currentFloor);
  const tile = currentFloor?.tiles.find((t: Tile) => t.id === editingTileId);

  const [currentEvent, setCurrentEvent] = useState<EventDraft | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setCurrentEvent(null);
    }
  }, [open]);

  const handleClose = () => {
    dispatch(setTileEventPanelOpen(false));
  };

  const handleAddEvent = () => {
    setCurrentEvent({
      eventId: `tile_event_${Date.now()}`,
      trigger: { type: 'step_on_tile' },
      conditions: [],
      conditionLogic: 'and',
      conditionFailText: '',
      actions: []
    });
  };

  const handleSaveEvent = () => {
    if (!currentEvent || !tile) return;
    dispatch(addTileEvent({ tileId: tile.id, event: currentEvent as TileEvent }));
    setCurrentEvent(null);
    message.success('瓦片事件已保存');
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!tile) return;
    dispatch(removeTileEvent({ tileId: tile.id, eventId }));
  };

  const handleApplyTemplate = (template: EventTemplate) => {
    setCurrentEvent({
      ...template.event,
      eventId: `tile_event_${Date.now()}`
    } as EventDraft);
    setTemplateModalOpen(false);
  };

  const tileLabel = tile
    ? `${tile.properties.name || tile.name} (${tile.x}, ${tile.y})`
    : '未选中';

  return (
    <Drawer
      title={
        <Space>
          <ThunderboltOutlined />
          <span>瓦片事件 - {tileLabel}</span>
        </Space>
      }
      placement="right"
      width={420}
      onClose={handleClose}
      open={open}
    >
      {!tile ? (
        <Empty description="请先选中一个瓦片" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEvent}>
              添加事件
            </Button>
            <Button onClick={() => setTemplateModalOpen(true)}>从模板选择</Button>
          </Space>

          {tile.events.length > 0 && (
            <>
              <Divider style={{ margin: '8px 0' }}>
                已有事件 <Tag color="blue">{tile.events.length}</Tag>
              </Divider>
              <List
                size="small"
                dataSource={tile.events}
                renderItem={(event) => (
                  <List.Item
                    actions={[
                      <Button key="edit" size="small" onClick={() => setCurrentEvent(event)}>
                        编辑
                      </Button>,
                      <Button
                        key="delete"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteEvent(event.eventId)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={event.eventId}
                      description={
                        <Space size={4}>
                          <Tag color="green">{triggerLabelMap[event.trigger?.type] || event.trigger?.type}</Tag>
                          <span>{event.actions?.length || 0} 个动作</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          {tile.events.length === 0 && !currentEvent && (
            <Empty description="暂无事件，点击上方按钮添加" style={{ marginTop: 32 }} />
          )}

          {currentEvent && (
            <EventEditorForm
              value={currentEvent}
              onChange={setCurrentEvent}
              onSave={handleSaveEvent}
              onCancel={() => setCurrentEvent(null)}
              showNextEventField
              header={<Divider style={{ margin: '8px 0' }}>编辑事件</Divider>}
            />
          )}
        </div>
      )}

      <EventTemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onApply={handleApplyTemplate}
      />
    </Drawer>
  );
};

export default TileEventPanel;
