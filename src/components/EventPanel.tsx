import { useState } from 'react';
import { Drawer, Button, Space, Divider, List, message, Tag, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { EventTemplate } from '../data/eventTemplates';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addGlobalEvent, removeGlobalEvent, addCustomEvent, removeCustomEvent } from '../store/mapSlice';
import type { GameEvent, Floor } from '../types';
import { EventEditorForm, EventTemplateModal, triggerLabelMap, type EventDraft } from './eventEditor';

interface EventPanelProps {
  open: boolean;
  onClose: () => void;
}

const EventPanel: React.FC<EventPanelProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const mapData = useAppSelector(state => state.map.mapData);
  const currentFloor = mapData.floors.find((f: Floor) => f.floorId === mapData.currentFloor);
  const [currentEvent, setCurrentEvent] = useState<EventDraft | null>(null);
  const [eventType, setEventType] = useState<'global' | 'custom'>('global');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const events = currentFloor ? (eventType === 'global' ? currentFloor.globalEvents : currentFloor.customEvents) : [];

  const handleAddEvent = () => {
    setCurrentEvent({
      eventId: `${eventType}_event_${Date.now()}`,
      trigger: { type: 'step_on_tile' },
      conditions: [],
      conditionLogic: 'and',
      conditionFailText: '',
      actions: []
    });
  };

  const handleSaveEvent = () => {
    if (!currentEvent) return;
    const event = currentEvent as GameEvent;
    if (eventType === 'global') {
      dispatch(addGlobalEvent(event));
    } else {
      dispatch(addCustomEvent(event));
    }
    setCurrentEvent(null);
    message.success('事件已保存');
  };

  const handleDeleteEvent = (eventId: string) => {
    if (eventType === 'global') {
      dispatch(removeGlobalEvent(eventId));
    } else {
      dispatch(removeCustomEvent(eventId));
    }
  };

  const handleApplyTemplate = (template: EventTemplate) => {
    setCurrentEvent({
      ...template.event,
      eventId: `${eventType}_event_${Date.now()}`
    } as EventDraft);
    setTemplateModalOpen(false);
  };

  return (
    <Drawer title="事件编辑" placement="right" width={400} onClose={onClose} open={open}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            value={eventType}
            onChange={(v) => {
              setEventType(v);
              setCurrentEvent(null);
            }}
            style={{ width: 100 }}
            options={[
              { value: 'global', label: '全局事件' },
              { value: 'custom', label: '自定义事件' }
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEvent}>
            添加事件
          </Button>
          <Button onClick={() => setTemplateModalOpen(true)}>从模板选择</Button>
        </Space>

        <Divider style={{ margin: '8px 0' }} />

        {events.length > 0 && (
          <List
            size="small"
            dataSource={events}
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
        )}

        {currentEvent && (
          <EventEditorForm
            value={currentEvent}
            onChange={setCurrentEvent}
            onSave={handleSaveEvent}
            onCancel={() => setCurrentEvent(null)}
            triggerFieldLabel="触发条件"
          />
        )}
      </div>

      <EventTemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onApply={handleApplyTemplate}
      />
    </Drawer>
  );
};

export default EventPanel;
