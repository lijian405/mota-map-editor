import { useRef, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSelectedTileId, addTile, updateTile, removeTile, saveHistory } from '../store/mapSlice';
import { tileLayerFromTileType, tileKindFromPresetTileType } from '../utils/mapUtils';
import { presetTiles } from '../data/presetTiles';
import { MAP_TILE_PX } from '../utils/mapBoardGeometry';
import { MapBorderFrame } from './MapBorderFrame';
import { setHoverPosition, setPanOffset, setZoom, setIsPanning, setSelectedTileForPlacement } from '../store/editorSlice';
import type { Floor, Tile, TileType } from '../types';

const TILE_SIZE = MAP_TILE_PX;

const MapCanvas: React.FC = () => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isTileDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const draggedTileRef = useRef<{ tile: Tile; offsetX: number; offsetY: number } | null>(null);
  const zoomRef = useRef(1);
  const panOffsetRef = useRef({ x: 0, y: 0 });

  const mapData = useAppSelector(state => state.map.mapData);
  const selectedTileId = useAppSelector(state => state.map.selectedTileId);
  const selectedTileForPlacement = useAppSelector(state => state.editor.selectedTileForPlacement);
  const zoom = useAppSelector(state => state.editor.zoom);
  const panOffset = useAppSelector(state => state.editor.panOffset);
  const isPanning = useAppSelector(state => state.editor.isPanning);

  zoomRef.current = zoom;
  panOffsetRef.current = panOffset;

  const currentFloor = mapData.floors.find((f: Floor) => f.floorId === mapData.currentFloor);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      dispatch(setZoom(zoomRef.current + delta));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedTileId) {
        const tileToDelete = currentFloor?.tiles.find((t: Tile) => t.id === selectedTileId);
        if (tileToDelete) {
          dispatch(saveHistory());
          dispatch(removeTile({ x: tileToDelete.x, y: tileToDelete.y }));
          dispatch(setSelectedTileId(null));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTileId, currentFloor, dispatch]);

  const getTileAtPosition = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!containerRef.current || !currentFloor) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;

    const mapX = (screenX - containerCenterX - panOffsetRef.current.x) / zoomRef.current + (currentFloor.mapWidth * TILE_SIZE) / 2;
    const mapY = (screenY - containerCenterY - panOffsetRef.current.y) / zoomRef.current + (currentFloor.mapHeight * TILE_SIZE) / 2;

    const tileX = Math.floor(mapX / TILE_SIZE);
    const tileY = Math.floor(mapY / TILE_SIZE);

    if (tileX >= 0 && tileX < currentFloor.mapWidth && tileY >= 0 && tileY < currentFloor.mapHeight) {
      return { x: tileX, y: tileY };
    }
    return null;
  }, [currentFloor]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      dispatch(setIsPanning(true));
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleTileMouseDown = (e: React.MouseEvent, tile: Tile) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (selectedTileForPlacement) return;

    const pos = getTileAtPosition(e.clientX, e.clientY);
    if (!pos) return;

    const offsetX = (pos.x - tile.x) * TILE_SIZE;
    const offsetY = (pos.y - tile.y) * TILE_SIZE;

    isTileDraggingRef.current = true;
    dispatch(saveHistory());
    draggedTileRef.current = { tile, offsetX, offsetY };
    dispatch(setSelectedTileId(tile.id));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTileDraggingRef.current && draggedTileRef.current && currentFloor) {
      const pos = getTileAtPosition(e.clientX, e.clientY);
      if (pos) {
        const newX = pos.x;
        const newY = pos.y;
        if (newX >= 0 && newX < currentFloor.mapWidth && newY >= 0 && newY < currentFloor.mapHeight) {
          const existingTile = currentFloor.tiles.find(t => t.x === newX && t.y === newY && t.id !== draggedTileRef.current!.tile.id);
          if (!existingTile) {
            dispatch(updateTile({ ...draggedTileRef.current.tile, x: newX, y: newY }));
          }
        }
      }
      return;
    }

    const pos = getTileAtPosition(e.clientX, e.clientY);
    dispatch(setHoverPosition(pos));

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      dispatch(setPanOffset({ x: panOffsetRef.current.x + dx, y: panOffsetRef.current.y + dy }));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isTileDraggingRef.current = false;
    draggedTileRef.current = null;
    dispatch(setIsPanning(false));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isPanning || isDraggingRef.current || isTileDraggingRef.current) return;

    const pos = getTileAtPosition(e.clientX, e.clientY);
    if (!pos || !currentFloor) return;

    if (e.button === 0 && selectedTileForPlacement) {
      const preset = presetTiles.find(
        p => p.type === selectedTileForPlacement.type || p.name === selectedTileForPlacement.type
      );
      if (!preset) return;
      const tt = preset.tileType as TileType;
      const newTile: Tile = {
        id: `${preset.type}_${pos.x}_${pos.y}_${Date.now()}`,
        x: pos.x,
        y: pos.y,
        type: tileKindFromPresetTileType(tt),
        name: preset.type,
        tileType: tt,
        layer: tileLayerFromTileType(preset.tileType),
        src: preset.src,
        properties: {},
        events: []
      };
      dispatch(saveHistory());
      dispatch(addTile(newTile));
    } else if (e.button === 0) {
      const existingTile = currentFloor.tiles.find((t: Tile) => t.x === pos.x && t.y === pos.y);
      if (existingTile) {
        dispatch(setSelectedTileId(existingTile.id));
      } else {
        dispatch(setSelectedTileId(null));
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(setSelectedTileForPlacement(null));
    dispatch(setSelectedTileId(null));
  };

  if (!currentFloor) {
    return <div ref={containerRef} style={{ flex: 1, background: '#1a1a2e' }} />;
  }

  const { mapWidth, mapHeight } = currentFloor;
  const mapPixelWidth = mapWidth * TILE_SIZE;
  const mapPixelHeight = mapHeight * TILE_SIZE;

  const renderBackground = () => {
    const cells = [];
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        cells.push(
          <div
            key={`bg-${x}-${y}`}
            style={{
              position: 'absolute',
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundImage: 'url(/images/grid.png)',
              backgroundSize: 'cover'
            }}
          />
        );
      }
    }
    return cells;
  };

  const renderTiles = () => {
    return currentFloor.tiles.map((tile: Tile) => (
      <div
        key={tile.id}
        onMouseDown={(e) => handleTileMouseDown(e, tile)}
        style={{
          position: 'absolute',
          left: tile.x * TILE_SIZE,
          top: tile.y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundImage: tile.src ? `url(${tile.src})` : 'none',
          backgroundSize: 'cover',
          border: tile.id === selectedTileId ? '2px solid #1890ff' : 'none',
          boxSizing: 'border-box',
          cursor: selectedTileForPlacement ? 'default' : 'move',
          opacity: tile.id === selectedTileId && isTileDraggingRef.current ? 0.7 : 1,
          zIndex: 5
        }}
      >
        {tile.events && tile.events.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: '0 0 0 4px',
              background: '#faad14',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 8,
              color: '#000',
              fontWeight: 'bold',
              lineHeight: 1,
              pointerEvents: 'none'
            }}
          >
            ⚡
          </div>
        )}
      </div>
    ));
  };

  const renderPlayerStart = () => {
    if (!currentFloor.playerStart) return null;
    return (
      <div
        style={{
          position: 'absolute',
          left: currentFloor.playerStart.x * TILE_SIZE,
          top: currentFloor.playerStart.y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundImage: 'url(/images/builds/player_icon.png)',
          backgroundSize: 'cover',
          zIndex: 10
        }}
      />
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : (selectedTileForPlacement ? 'crosshair' : 'default'),
        backgroundColor: '#1a1a2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
        }}
      >
        <MapBorderFrame mapPixelWidth={mapPixelWidth} mapPixelHeight={mapPixelHeight}>
          <div style={{ position: 'relative', width: mapPixelWidth, height: mapPixelHeight }}>
            {renderBackground()}
            {renderTiles()}
            {renderPlayerStart()}
          </div>
        </MapBorderFrame>
      </div>
    </div>
  );
};

export default MapCanvas;