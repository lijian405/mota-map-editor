import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import Toolbar from './components/Toolbar';
import TileLibrary from './components/TileLibrary';
import MapCanvas from './components/MapCanvas';
import PropertyPanel from './components/PropertyPanel';
import StatusBar from './components/StatusBar';
import PreviewMode from './components/PreviewMode';
import StoryWorkspace from './components/story/StoryWorkspace';
import { setPreviewOpen, setCopiedTile, setSelectedTileForPlacement } from './store/editorSlice';
import { setMapData, undo, redo } from './store/mapSlice';
import { presetTiles } from './data/presetTiles';
import { message } from 'antd';

const AUTOSAVE_KEY = 'magic_tower_editor_autosave';
const AUTOSAVE_INTERVAL = 5000;

function App() {
  const dispatch = useAppDispatch();
  const mapData = useAppSelector(state => state.map.mapData);
  const workspace = useAppSelector(state => state.editor.workspace);
  const previewOpen = useAppSelector(state => state.editor.previewOpen);
  const selectedTileId = useAppSelector(state => state.map.selectedTileId);
  const copiedTile = useAppSelector(state => state.editor.copiedTile);
  const pastLength = useAppSelector(state => state.map.past.length);
  const futureLength = useAppSelector(state => state.map.future.length);

  useEffect(() => {
    const savedData = localStorage.getItem(AUTOSAVE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        dispatch(setMapData(parsed));
        console.log('[AutoSave] 已恢复上次编辑');
      } catch (e) {
        console.error('[AutoSave] 恢复失败', e);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(mapData));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mapData]);

  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(mapData));
      console.log('[AutoSave] 地图已自动保存');
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [mapData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (workspace !== 'map') return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          if (selectedTileId) {
            const currentFloor = mapData.floors.find((f: { floorId: number }) => f.floorId === mapData.currentFloor);
            if (currentFloor) {
              const tile = currentFloor.tiles.find((t: { id: string }) => t.id === selectedTileId);
              if (tile) {
                const preset = presetTiles.find(p => p.type === tile.name || p.name === tile.name);
                if (preset) {
                  dispatch(setCopiedTile({
                    name: preset.name,
                    tileType: preset.tileType,
                    src: preset.src
                  }));
                  message.success('已复制 Tile');
                }
              }
            }
          }
        } else if (e.key === 'v') {
          if (copiedTile) {
            dispatch(setSelectedTileForPlacement(copiedTile));
            message.success('已粘贴 Tile，请点击画布放置');
          }
        } else if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (pastLength > 0) {
            dispatch(undo());
            message.success('已撤销');
          }
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          if (futureLength > 0) {
            dispatch(redo());
            message.success('已重做');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspace, selectedTileId, copiedTile, mapData, dispatch, pastLength, futureLength]);

  return (
    <div className="app-container">
      <Toolbar />
      {workspace === 'map' ? (
        <div className="main-content">
          <TileLibrary />
          <MapCanvas />
          <PropertyPanel />
        </div>
      ) : (
        <StoryWorkspace />
      )}
      {workspace === 'map' && <StatusBar />}
      <PreviewMode open={previewOpen} onClose={() => dispatch(setPreviewOpen(false))} />
    </div>
  );
}

export default App;
