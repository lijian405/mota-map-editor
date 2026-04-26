import { Form, InputNumber, Input, Select, Divider, Space, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  updateTile,
  removeTile,
  setSelectedTileId,
  setSelectedGrid,
  updatePlayerStart,
  updateStairs,
  updateMapSize
} from '../store/mapSlice';
import { presetTiles, tileCategories } from '../data/presetTiles';
import { tileKindFromPresetTileType } from '../utils/mapUtils';
import type { Floor, Tile, PresetTile, TileType, FootprintOrigin } from '../types';

/** 门瓦片 type → 消耗的钥匙（与 presetTiles 中黄门/蓝门等一致） */
const DOOR_TILE_TO_KEY: Record<string, 'yellow' | 'blue' | 'red' | 'green'> = {
  yellowgate: 'yellow',
  bluegate: 'blue',
  redgate: 'red',
  greengate: 'green',
  greenGate: 'green'
};

function keyTypeForDoorTile(tileType: string): 'yellow' | 'blue' | 'red' | 'green' | undefined {
  return DOOR_TILE_TO_KEY[tileType];
}

const KEY_TYPE_LABEL: Record<'yellow' | 'blue' | 'red' | 'green', string> = {
  yellow: '黄钥匙',
  blue: '蓝钥匙',
  red: '红钥匙',
  green: '绿钥匙'
};

/** 与 Tile库一致类型的中文名（未列出则用 preset.name / 怪物编号） */
const PRESET_LABELS: Partial<Record<string, string>> = {
  wall: '墙',
  floor: '地板',
  airWall: '空气墙',
  lava: '熔岩',
  rail: '轨道',
  up: '上楼楼梯',
  down: '下楼楼梯',
  shopLeft: '商店（左）',
  shopCenter: '商店（中）',
  shopRight: '商店（右）',
  yellowgate: '黄门',
  bluegate: '蓝门',
  redgate: '红门',
  greengate: '绿门',
  yellowkey: '黄钥匙',
  bluekey: '蓝钥匙',
  redkey: '红钥匙',
  attackgem: '攻击宝石',
  defencegem: '防御宝石',
  hp: '红血瓶',
  hplarge: '大红血瓶',
  luckycoins: '幸运币',
  magickey: '万能钥匙',
  chuansong: '传送石',
  notepad: '记事本',
  tiejian: '铁剑',
  tiedun: '铁盾',
  yinjian: '银剑',
  yindun: '银盾',
  qishijian: '骑士剑',
  qishidun: '骑士盾',
  shengjian: '圣剑',
  shengdun: '圣盾',
  shenshengjian: '神圣剑',
  shenshengdun: '神圣盾',
  thief: '盗贼',
  wise: '智者',
  business: '商人'
};

function presetOptionLabel(p: PresetTile): string {
  if (PRESET_LABELS[p.type]) return PRESET_LABELS[p.type]!;
  if (p.type.startsWith('monster')) return p.type.replace(/^monster/, '怪物');
  return p.name;
}

function stripFootprint(t: Tile): Tile {
  const next = { ...t };
  delete next.footprintW;
  delete next.footprintH;
  delete next.footprintOrigin;
  return next;
}

function commitMonsterFootprint(
  tile: Tile,
  patch: Partial<Pick<Tile, 'footprintW' | 'footprintH' | 'footprintOrigin'>>
): Tile {
  const merged = { ...tile, ...patch };
  const w = merged.footprintW ?? 1;
  const h = merged.footprintH ?? 1;
  const o: FootprintOrigin = merged.footprintOrigin ?? 'topleft';
  const next = { ...merged };
  if (w <= 1 && h <= 1 && o === 'topleft') {
    delete next.footprintW;
    delete next.footprintH;
    delete next.footprintOrigin;
  } else {
    next.footprintW = Math.max(1, Math.floor(w));
    next.footprintH = Math.max(1, Math.floor(h));
    next.footprintOrigin = o;
  }
  return next;
}

const PropertyPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const mapData = useAppSelector(state => state.map.mapData);
  const selectedTileId = useAppSelector(state => state.map.selectedTileId);
  const selectedGrid = useAppSelector(state => state.map.selectedGrid);
  const currentFloor = mapData.floors.find((f: Floor) => f.floorId === mapData.currentFloor);
  const selectedTile = currentFloor?.tiles.find((t: Tile) => t.id === selectedTileId);

  const handleTileTypeChange = (newPresetId: string) => {
    if (!selectedTile) return;
    const preset = presetTiles.find(p => p.type === newPresetId || p.name === newPresetId);
    const keyFromDoor = keyTypeForDoorTile(newPresetId);
    let nextProperties = { ...selectedTile.properties };
    if (keyFromDoor) {
      nextProperties.keyType = keyFromDoor;
    } else if (preset?.tileType !== 'door') {
      const { keyType: _removed, ...rest } = nextProperties;
      nextProperties = rest as typeof nextProperties;
    }
    const base: Tile = {
      ...selectedTile,
      type: preset ? tileKindFromPresetTileType(preset.tileType as TileType) : selectedTile.type,
      name: preset ? preset.type : newPresetId,
      ...(preset
        ? {
            tileType: preset.tileType as Tile['tileType'],
            layer: preset.layer,
            src: preset.src
          }
        : {}),
      properties: nextProperties
    };
    const nextTile = preset?.tileType === 'monster' ? base : stripFootprint(base);
    dispatch(updateTile(nextTile));
  };

  const handlePropertyChange = (key: string, value: unknown) => {
    if (!selectedTile) return;
    dispatch(updateTile({
      ...selectedTile,
      properties: { ...selectedTile.properties, [key]: value }
    }));
  };

  const handleFootprintChange = (patch: Partial<Pick<Tile, 'footprintW' | 'footprintH' | 'footprintOrigin'>>) => {
    if (!selectedTile || selectedTile.tileType !== 'monster') return;
    dispatch(updateTile(commitMonsterFootprint(selectedTile, patch)));
  };

  const handleDeleteTile = () => {
    if (!selectedTile) return;
    const { x, y } = selectedTile;
    dispatch(removeTile({ x, y }));
    dispatch(setSelectedTileId(null));
    dispatch(setSelectedGrid({ x, y }));
  };

  const handlePlayerStartChange = (field: string, value: number) => {
    if (!currentFloor) return;
    dispatch(updatePlayerStart({ ...currentFloor.playerStart, [field]: value }));
  };

  const handleStairsChange = (position: 'up' | 'down', coords: { x: number; y: number } | null) => {
    dispatch(updateStairs({ position, coords }));
  };

  const handleMapSizeChange = (field: 'width' | 'height', value: number | null) => {
    if (!currentFloor || value === null) return;
    const newWidth = field === 'width' ? value : currentFloor.mapWidth;
    const newHeight = field === 'height' ? value : currentFloor.mapHeight;
    dispatch(updateMapSize({ width: newWidth, height: newHeight }));
  };

  if (!currentFloor) {
    return <div style={{ width: 280, background: '#001529', borderLeft: '1px solid #333', padding: 16 }}>加载中...</div>;
  }

  if (selectedTile) {
    return (
      <div style={{ width: 280, background: '#001529', borderLeft: '1px solid #333', padding: 16, overflow: 'auto' }}>
        <div style={{ color: '#fff', marginBottom: 16 }}>
          <h3>Tile 属性</h3>
          <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
        </div>

        <Form layout="vertical" size="small">
          <Form.Item label="坐标">
            <Space>
              <InputNumber value={selectedTile.x} disabled style={{ width: 80 }} />
              <span style={{ color: '#999' }}>,</span>
              <InputNumber value={selectedTile.y} disabled style={{ width: 80 }} />
            </Space>
          </Form.Item>

          <Form.Item label="大类 (type)">
            <Input value={selectedTile.type} disabled style={{ color: '#fff' }} />
          </Form.Item>
          <Form.Item label="预设 (name，与 Tile 库一致)">
            <Select
              value={selectedTile.name === 'greenGate' ? 'greengate' : selectedTile.name}
              onChange={handleTileTypeChange}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              popupMatchSelectWidth={false}
            >
              {(() => {
                const nameKey = selectedTile.name === 'greenGate' ? 'greengate' : selectedTile.name;
                const hasPreset = presetTiles.some(p => p.type === nameKey);
                return tileCategories.map(cat => (
                  <Select.OptGroup key={cat.key} label={cat.label}>
                    {cat.key === 'terrain' && !hasPreset && (
                      <Select.Option value={selectedTile.name} label={selectedTile.name}>
                        {selectedTile.name}（非预设类型）
                      </Select.Option>
                    )}
                    {presetTiles
                      .filter(p => p.tileType === cat.key)
                      .map(p => (
                        <Select.Option key={p.type} value={p.type} label={presetOptionLabel(p)}>
                          {presetOptionLabel(p)}
                        </Select.Option>
                      ))}
                  </Select.OptGroup>
                ));
              })()}
            </Select>
          </Form.Item>

          {selectedTile.tileType === 'monster' && (
            <>
              <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
              <h4 style={{ color: '#fff', marginBottom: 8 }}>怪物属性</h4>
              <Form.Item label="名称">
                <Input
                  value={selectedTile.properties.name || ''}
                  onChange={(e) => handlePropertyChange('name', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="生命值">
                <InputNumber
                  value={selectedTile.properties.hp || 0}
                  onChange={(v) => handlePropertyChange('hp', v)}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="攻击力">
                <InputNumber
                  value={selectedTile.properties.attack || 0}
                  onChange={(v) => handlePropertyChange('attack', v)}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="防御力">
                <InputNumber
                  value={selectedTile.properties.defense || 0}
                  onChange={(v) => handlePropertyChange('defense', v)}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="经验值">
                <InputNumber
                  value={selectedTile.properties.exp || 0}
                  onChange={(v) => handlePropertyChange('exp', v)}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="金币">
                <InputNumber
                  value={selectedTile.properties.gold || 0}
                  onChange={(v) => handlePropertyChange('gold', v)}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Divider style={{ margin: '12px 0', borderColor: '#333' }} />
              <h4 style={{ color: '#fff', marginBottom: 8 }}>多格占地（脚印）</h4>
              <p style={{ color: '#888', fontSize: 11, margin: '0 0 8px' }}>
                与 map_data 一致：导出为 footprintW / footprintH / footprintOrigin；1×1 左上角可不写。
              </p>
              <Form.Item label="占地宽 footprintW">
                <InputNumber
                  value={selectedTile.footprintW ?? 1}
                  onChange={(v) =>
                    handleFootprintChange({ footprintW: v === null || v === undefined ? 1 : Number(v) })
                  }
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="占地高 footprintH">
                <InputNumber
                  value={selectedTile.footprintH ?? 1}
                  onChange={(v) =>
                    handleFootprintChange({ footprintH: v === null || v === undefined ? 1 : Number(v) })
                  }
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="原点 footprintOrigin">
                <Select
                  style={{ width: '100%' }}
                  value={(selectedTile.footprintOrigin ?? 'topleft') as FootprintOrigin}
                  onChange={(v) => handleFootprintChange({ footprintOrigin: v })}
                  options={[
                    { value: 'topleft', label: 'topleft（x,y 为左上角）' },
                    { value: 'center', label: 'center（x,y 为心点格）' },
                    { value: 'heart', label: 'heart（同 center）' }
                  ]}
                />
              </Form.Item>
            </>
          )}

          {selectedTile.tileType === 'npc' && (
            <>
              <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
              <h4 style={{ color: '#fff', marginBottom: 8 }}>NPC 属性</h4>
              <Form.Item label="名称">
                <Input
                  value={selectedTile.properties.name || ''}
                  onChange={(e) => handlePropertyChange('name', e.target.value)}
                />
              </Form.Item>
              <Form.Item label="对话内容">
                <Input.TextArea
                  value={selectedTile.properties.dialog || ''}
                  onChange={(e) => handlePropertyChange('dialog', e.target.value)}
                  rows={4}
                />
              </Form.Item>
            </>
          )}

          {selectedTile.tileType === 'door' && (
            <>
              <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
              <h4 style={{ color: '#fff', marginBottom: 8 }}>门 属性</h4>
              <Form.Item label="对应钥匙（随门类型）">
                <Select
                  value={
                    keyTypeForDoorTile(selectedTile.name) ??
                    (selectedTile.properties.keyType as 'yellow' | 'blue' | 'red' | 'green' | undefined) ??
                    'yellow'
                  }
                  disabled
                  style={{ width: '100%' }}
                >
                  <Select.Option value="yellow">{KEY_TYPE_LABEL.yellow}</Select.Option>
                  <Select.Option value="blue">{KEY_TYPE_LABEL.blue}</Select.Option>
                  <Select.Option value="red">{KEY_TYPE_LABEL.red}</Select.Option>
                  <Select.Option value="green">{KEY_TYPE_LABEL.green}</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Divider style={{ margin: '16px 0', borderColor: '#333' }} />
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteTile}
            style={{ width: '100%' }}
          >
            删除 Tile
          </Button>
        </Form>
      </div>
    );
  }

  if (selectedGrid) {
    return (
      <div style={{ width: 280, background: '#001529', borderLeft: '1px solid #333', padding: 16, overflow: 'auto' }}>
        <div style={{ color: '#fff', marginBottom: 16 }}>
          <h3>空格子</h3>
          <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
          <p style={{ color: '#999', fontSize: 12, margin: 0 }}>
            坐标 ({selectedGrid.x}, {selectedGrid.y})，可在此放置 Tile 或用于剧情编辑器的「地图选格」。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: 280, background: '#001529', borderLeft: '1px solid #333', padding: 16, overflow: 'auto' }}>
      <div style={{ color: '#fff', marginBottom: 16 }}>
        <h3>地图信息</h3>
        <Divider style={{ margin: '8px 0', borderColor: '#333' }} />
      </div>

      <Form layout="vertical" size="small">
        <Form.Item label="楼层">
          <Input value={`第 ${currentFloor.floorId} 层`} disabled />
        </Form.Item>

        <Divider style={{ margin: '16px 0', borderColor: '#333' }} />
        <h4 style={{ color: '#fff', marginBottom: 8 }}>地图尺寸（格数）</h4>

        <Space.Compact block>
          <Form.Item label="宽度" style={{ marginBottom: 8 }}>
            <InputNumber
              value={currentFloor.mapWidth}
              onChange={(v) => handleMapSizeChange('width', v)}
              min={5}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="高度" style={{ marginBottom: 8 }}>
            <InputNumber
              value={currentFloor.mapHeight}
              onChange={(v) => handleMapSizeChange('height', v)}
              min={5}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space.Compact>

        <Divider style={{ margin: '16px 0', borderColor: '#333' }} />
        <h4 style={{ color: '#fff', marginBottom: 8 }}>玩家初始状态</h4>

        <Form.Item label="起始位置 X">
          <Space.Compact block>
            <span style={{ background: '#f5f5f5', padding: '0 8px', display: 'flex', alignItems: 'center', color: '#666', borderRadius: '6px 0 0 6px' }}>X</span>
            <InputNumber
              value={currentFloor.playerStart.x}
              onChange={(v) => handlePlayerStartChange('x', v || 0)}
              style={{ flex: 1 }}
            />
            <span style={{ background: '#f5f5f5', padding: '0 8px', display: 'flex', alignItems: 'center', color: '#666', borderRadius: '0 6px 6px 0' }}>Y</span>
            <InputNumber
              value={currentFloor.playerStart.y}
              onChange={(v) => handlePlayerStartChange('y', v || 0)}
              style={{ flex: 1 }}
            />
          </Space.Compact>
        </Form.Item>

        <Form.Item label="生命值">
          <InputNumber
            value={currentFloor.playerStart.hp}
            onChange={(v) => handlePlayerStartChange('hp', v || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="攻击力">
          <InputNumber
            value={currentFloor.playerStart.attack}
            onChange={(v) => handlePlayerStartChange('attack', v || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="防御力">
          <InputNumber
            value={currentFloor.playerStart.defense}
            onChange={(v) => handlePlayerStartChange('defense', v || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="金币">
          <InputNumber
            value={currentFloor.playerStart.gold}
            onChange={(v) => handlePlayerStartChange('gold', v || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="黄钥匙">
          <InputNumber
            value={currentFloor.playerStart.yellowKeys}
            onChange={(v) => handlePlayerStartChange('yellowKeys', v || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="蓝钥匙">
          <InputNumber
            value={currentFloor.playerStart.blueKeys}
            onChange={(v) => handlePlayerStartChange('blueKeys', v || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="红钥匙">
          <InputNumber
            value={currentFloor.playerStart.redKeys}
            onChange={(v) => handlePlayerStartChange('redKeys', v || 0)}
            min={0}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Divider style={{ margin: '16px 0', borderColor: '#333' }} />
        <h4 style={{ color: '#fff', marginBottom: 8 }}>楼梯位置</h4>

        <Form.Item label="上楼楼梯">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              size="small"
              onClick={() => handleStairsChange('up', { x: currentFloor.playerStart.x, y: currentFloor.playerStart.y })}
            >
              设置为起始位置
            </Button>
            {currentFloor.stairs.up && (
              <span style={{ color: '#888' }}>
                位置: ({currentFloor.stairs.up.x}, {currentFloor.stairs.up.y})
              </span>
            )}
          </Space>
        </Form.Item>

        <Form.Item label="下楼楼梯">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              size="small"
              onClick={() => handleStairsChange('down', { x: currentFloor.playerStart.x, y: currentFloor.playerStart.y })}
            >
              设置为起始位置
            </Button>
            {currentFloor.stairs.down && (
              <span style={{ color: '#888' }}>
                位置: ({currentFloor.stairs.down.x}, {currentFloor.stairs.down.y})
              </span>
            )}
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PropertyPanel;