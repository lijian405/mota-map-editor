import { Modal, List, Button } from 'antd';
import { eventTemplates, EventTemplate } from '../../data/eventTemplates';

interface EventTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (template: EventTemplate) => void;
}

const EventTemplateModal = ({ open, onClose, onApply }: EventTemplateModalProps) => (
  <Modal title="选择事件模板" open={open} onCancel={onClose} footer={null} width={600}>
    <List
      dataSource={eventTemplates}
      renderItem={(template) => (
        <List.Item
          actions={[
            <Button key="apply" type="primary" size="small" onClick={() => onApply(template)}>
              应用
            </Button>
          ]}
        >
          <List.Item.Meta title={template.name} description={template.description} />
        </List.Item>
      )}
    />
  </Modal>
);

export default EventTemplateModal;
