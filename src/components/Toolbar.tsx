import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Button, Space, Dropdown, Slider, Tooltip, message, Upload, Popconfirm, Modal, Segmented } from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  AimOutlined,
  BorderOutlined,
  EyeOutlined,
  ExperimentOutlined,
  CopyOutlined,
  DeleteOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { setZoom, toggleGrid, resetView, setPreviewOpen, setCopiedTile, setSelectedTileForPlacement, setWorkspace } from '../store/editorSlice';
import { addFloor, removeFloor, switchFloor, setMapData, clearMap, undo, redo } from '../store/mapSlice';
import { exportMapToJson, importMapFromJson } from '../utils/mapUtils';
import type { MenuProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { presetTiles } from '../data/presetTiles';
import { useState } from 'react';

const Toolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const workspace = useAppSelector(state => state.editor.workspace);
  const zoom = useAppSelector(state => state.editor.zoom);
  const showGrid = useAppSelector(state => state.editor.showGrid);
  const mapData = useAppSelector(state => state.map.mapData);
  const selectedTileId = useAppSelector(state => state.map.selectedTileId);
  const copiedTile = useAppSelector(state => state.editor.copiedTile);
  const pastLength = useAppSelector(state => state.map.past.length);
  const futureLength = useAppSelector(state => state.map.future.length);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const canUndo = pastLength > 0;
  const canRedo = futureLength > 0;

  const floorItems: MenuProps['items'] = mapData.floors.map((floor: { floorId: number }) => ({
    key: floor.floorId,
    label: `第 ${floor.floorId} 层`
  }));

  const handleFloorChange: MenuProps['onClick'] = ({ key }) => {
    dispatch(switchFloor(parseInt(key as string)));
  };

  const handleAddFloor = () => {
    dispatch(addFloor({}));
    message.success('已添加新楼层');
  };

  const handleRemoveCurrentFloor = () => {
    dispatch(removeFloor(mapData.currentFloor));
    message.success('已删除当前楼层');
  };

  const handleCopyTile = () => {
    if (!selectedTileId) {
      message.warning('请先选中要复制的 Tile');
      return;
    }
    const currentFloor = mapData.floors.find((f: { floorId: number }) => f.floorId === mapData.currentFloor);
    if (!currentFloor) return;
    const tile = currentFloor.tiles.find((t: { id: string }) => t.id === selectedTileId);
    if (!tile) {
      message.warning('未找到选中的 Tile');
      return;
    }
    const preset = presetTiles.find(p => p.type === tile.name || p.name === tile.name);
    if (preset) {
      dispatch(setCopiedTile({
        name: preset.name,
        tileType: preset.tileType,
        src: preset.src
      }));
      message.success('已复制 Tile');
    } else {
      message.warning('无法复制：该 Tile 类型不在预设中');
    }
  };

  const handlePasteTile = () => {
    if (!copiedTile) {
      message.warning('剪贴板为空，请先复制 Tile');
      return;
    }
    dispatch(setSelectedTileForPlacement(copiedTile));
    message.success('已粘贴 Tile，请点击画布放置');
  };

  const handleClearMap = () => {
    dispatch(clearMap());
    message.success('当前楼层已清空');
  };

  const handleSave = () => {
    exportMapToJson(mapData, `魔塔地图_${mapData.currentFloor}层.json`);
    message.success('地图已保存');
  };

  const handleOpen = (file: RcFile) => {
    importMapFromJson(file)
      .then(data => {
        dispatch(setMapData(data));
        message.success('地图加载成功');
      })
      .catch(err => {
        message.error(err.message || '加载失败');
      });
    return false;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      background: '#001529',
      borderBottom: '1px solid #333'
    }}>
      <Space>
        <Segmented
          value={workspace}
          onChange={(v) => dispatch(setWorkspace(v as 'map' | 'story'))}
          options={[
            { value: 'map', label: '地图' },
            { value: 'story', label: '剧情' }
          ]}
        />
        <div style={{ width: 1, height: 24, background: '#333', margin: '0 8px' }} />
        {workspace === 'map' && (
          <>
            <Tooltip title="新建地图">
              <Button icon={<PlusOutlined />} type="primary" />
            </Tooltip>
            <Upload beforeUpload={handleOpen} showUploadList={false} accept=".json">
              <Tooltip title="打开地图">
                <Button icon={<FolderOpenOutlined />} />
              </Tooltip>
            </Upload>
            <Tooltip title="保存地图">
              <Button icon={<SaveOutlined />} onClick={handleSave} />
            </Tooltip>
            <div style={{ width: 1, height: 24, background: '#333', margin: '0 8px' }} />
            <Tooltip title="撤销 (Ctrl+Z)">
              <Button icon={<UndoOutlined />} onClick={() => dispatch(undo())} disabled={!canUndo} />
            </Tooltip>
            <Tooltip title="重做 (Ctrl+Y)">
              <Button icon={<RedoOutlined />} onClick={() => dispatch(redo())} disabled={!canRedo} />
            </Tooltip>
            <div style={{ width: 1, height: 24, background: '#333', margin: '0 8px' }} />
            <Dropdown menu={{ items: floorItems, onClick: handleFloorChange }} trigger={['click']}>
              <Button>第 {mapData.currentFloor} 层 ▾</Button>
            </Dropdown>
            <Tooltip title="添加楼层">
              <Button icon={<PlusOutlined />} onClick={handleAddFloor} />
            </Tooltip>
            <Popconfirm
              title="删除当前楼层？"
              description="该层地图与事件将被移除，楼层号会重新连续编号。"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              disabled={mapData.floors.length <= 1}
              onConfirm={handleRemoveCurrentFloor}
            >
              <Tooltip title={mapData.floors.length <= 1 ? '至少保留一层' : '删除当前楼层'}>
                <Button icon={<MinusOutlined />} danger disabled={mapData.floors.length <= 1} />
              </Tooltip>
            </Popconfirm>
            <div style={{ width: 1, height: 24, background: '#333', margin: '0 8px' }} />
            <Tooltip title="复制 (Ctrl+C)">
              <Button icon={<CopyOutlined />} onClick={handleCopyTile} />
            </Tooltip>
            <Tooltip title="粘贴 (Ctrl+V)">
              <Button icon={<CopyOutlined />} onClick={handlePasteTile} disabled={!copiedTile} />
            </Tooltip>
            <Popconfirm
              title="清空当前楼层？"
              description="该层所有放置的 Tile 将被清除。"
              okText="清空"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleClearMap}
            >
              <Tooltip title="清空当前楼层">
                <Button icon={<DeleteOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          </>
        )}
      </Space>

      <Space>
        {workspace === 'map' && (
          <>
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={() => dispatch(setZoom(zoom - 0.25))} disabled={zoom <= 0.25} />
            </Tooltip>
            <Slider
              style={{ width: 100 }}
              min={0.25}
              max={2}
              step={0.25}
              value={zoom}
              onChange={(v) => dispatch(setZoom(v))}
              tooltip={{ formatter: (v) => `${Math.round((v || 1) * 100)}%` }}
            />
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={() => dispatch(setZoom(zoom + 0.25))} disabled={zoom >= 2} />
            </Tooltip>
            <Tooltip title="重置视图">
              <Button icon={<AimOutlined />} onClick={() => dispatch(resetView())} />
            </Tooltip>
            <div style={{ width: 1, height: 24, background: '#333', margin: '0 8px' }} />
            <Tooltip title="显示/隐藏网格">
              <Button
                icon={<BorderOutlined />}
                type={showGrid ? 'primary' : 'default'}
                onClick={() => dispatch(toggleGrid())}
              />
            </Tooltip>
            <Tooltip title="预览模式">
              <Button icon={<EyeOutlined />} onClick={() => dispatch(setPreviewOpen(true))} />
            </Tooltip>
            <Tooltip title="关卡验证">
              <Button icon={<ExperimentOutlined />} />
            </Tooltip>
          </>
        )}
        <Tooltip title="快捷键">
          <Button icon={<KeyOutlined />} onClick={() => setShortcutsModalOpen(true)} />
        </Tooltip>
      </Space>

      <Modal
        title="快捷键列表"
        open={shortcutsModalOpen}
        onCancel={() => setShortcutsModalOpen(false)}
        footer={null}
        width={500}
      >
        <div style={{ lineHeight: 2 }}>
          <h4>画布操作</h4>
          <div><kbd>Ctrl + C</kbd> 复制选中的 Tile</div>
          <div><kbd>Ctrl + V</kbd> 粘贴已复制的 Tile</div>
          <div><kbd>Ctrl + Z</kbd> 撤销</div>
          <div><kbd>Ctrl + Y</kbd> 或 <kbd>Ctrl + Shift + Z</kbd> 重做</div>
          <div><kbd>Delete</kbd> 删除选中的 Tile</div>
          <div><kbd>鼠标滚轮</kbd> 缩放画布</div>
          <div><kbd>右键拖拽</kbd> 平移画布</div>
          <h4>预览模式</h4>
          <div><kbd>W / ↑</kbd> 向上移动</div>
          <div><kbd>S / ↓</kbd> 向下移动</div>
          <div><kbd>A / ←</kbd> 向左移动</div>
          <div><kbd>D / →</kbd> 向右移动</div>
          <h4>其他</h4>
          <div><kbd>右键</kbd> 取消当前选中</div>
        </div>
      </Modal>
    </div>
  );
};

export default Toolbar;