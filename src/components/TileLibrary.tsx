import { useState } from 'react';
import { Tabs, Input, Tooltip } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { presetTiles, tileCategories } from '../data/presetTiles';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedTileForPlacement } from '../store/editorSlice';

const TileLibrary: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedTileForPlacement = useAppSelector(state => state.editor.selectedTileForPlacement);
  const [searchText, setSearchText] = useState('');

  const filteredTiles = presetTiles.filter(tile =>
    tile.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const groupedTiles = tileCategories.map(cat => ({
    ...cat,
    tiles: filteredTiles.filter(t => t.tileType === cat.key || (cat.key === 'terrain' && ['wall', 'floor', 'airWall', 'lava', 'rail', 'stairs_up', 'stairs_down'].includes(t.tileType)))
  })).filter(g => g.tiles.length > 0);

  const handleTileClick = (tile: typeof presetTiles[0]) => {
    dispatch(setSelectedTileForPlacement({
      type: tile.type,
      tileType: tile.tileType,
      src: tile.src
    }));
  };

  const tabItems = groupedTiles.map(cat => ({
    key: cat.key,
    label: cat.label,
    children: (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
        padding: 8
      }}>
        {cat.tiles.map(tile => (
          <Tooltip title={tile.name} key={tile.name}>
            <div
              onClick={() => handleTileClick(tile)}
              style={{
                width: 40,
                height: 40,
                border: selectedTileForPlacement?.type === tile.type ? '2px solid #1890ff' : '1px solid #333',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedTileForPlacement?.type === tile.type ? '#1a3a5c' : '#0a0a14',
                transition: 'all 0.2s'
              }}
            >
              <img
                src={tile.src}
                alt={tile.name}
                style={{ width: 32, height: 32 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </Tooltip>
        ))}
      </div>
    )
  }));

  return (
    <div style={{
      width: 300,
      background: '#001529',
      borderRight: '1px solid #333',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '8px' }}>
        <Input
          placeholder="搜索 Tile..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
        />
      </div>
      {selectedTileForPlacement && (
        <div style={{
          padding: '8px 12px',
          background: '#1a3a5c',
          borderBottom: '1px solid #333',
          fontSize: 12,
          color: '#fff'
        }}>
          已选择Tile
          <br />
          <span style={{ color: '#888', fontSize: 10 }}>
            点击画布放置 | 右键取消
          </span>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tabs defaultActiveKey="terrain" tabPosition="left" style={{ height: '100%' }} items={tabItems} />
      </div>
    </div>
  );
};

export default TileLibrary;