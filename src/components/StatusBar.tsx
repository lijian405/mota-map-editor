import { useAppSelector } from '../store/hooks';

const StatusBar: React.FC = () => {
  const hoverPosition = useAppSelector(state => state.editor.hoverPosition);
  const mapData = useAppSelector(state => state.map.mapData);
  const currentTool = useAppSelector(state => state.editor.currentTool);

  const toolNames: Record<string, string> = {
    select: '选择',
    paint: '绘制',
    erase: '擦除',
    fill: '填充'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 16px',
      background: '#001529',
      borderTop: '1px solid #333',
      fontSize: 12,
      color: '#888'
    }}>
      <div style={{ display: 'flex', gap: 24 }}>
        <span>
          工具: <span style={{ color: '#fff' }}>{toolNames[currentTool]}</span>
        </span>
        {hoverPosition && (
          <span>
            坐标: <span style={{ color: '#fff' }}>({hoverPosition.x}, {hoverPosition.y})</span>
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <span>
          当前楼层: <span style={{ color: '#fff' }}>第 {mapData.currentFloor} 层</span>
        </span>
        <span>
          总楼层数: <span style={{ color: '#fff' }}>{mapData.totalFloors}</span>
        </span>
        <span style={{ color: '#52c41a' }}>✓ 无错误</span>
      </div>
    </div>
  );
};

export default StatusBar;