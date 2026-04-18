import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Modal, Button, Alert } from 'antd';
import { useAppSelector } from '../store/hooks';
import { presetTiles } from '../data/presetTiles';
import { MAP_TILE_PX } from '../utils/mapBoardGeometry';
import { MapBorderFrame } from './MapBorderFrame';
import { isSyntheticFillTile, stripSyntheticFillTiles } from '../utils/mapUtils';
import {
  getPreviewTile,
  makeTileFromType,
  previewMapCellKey,
  runEventsWithTrigger,
  runEventsWithTriggerReturnWork,
  runGameInitEvents,
  type PreviewContext,
  type PreviewPlayer
} from '../utils/previewEventRuntime';
import type { Tile, Floor, PresetTile } from '../types';

function presetForMapTile(tile: Pick<Tile, 'name' | 'type'>): PresetTile | undefined {
  const id = tile.name || tile.type;
  return presetTiles.find(p => p.type === id || p.name === id);
}

const TILE_SIZE = MAP_TILE_PX;

interface PreviewModeProps {
  open: boolean;
  onClose: () => void;
}

function bumpDirFromDelta(dx: number, dy: number): 'up' | 'down' | 'left' | 'right' {
  if (dx === 1) return 'right';
  if (dx === -1) return 'left';
  if (dy === 1) return 'down';
  return 'up';
}

const PreviewMode: React.FC<PreviewModeProps> = ({ open, onClose }) => {
  const mapData = useAppSelector(state => state.map.mapData);

  const [previewFloorId, setPreviewFloorId] = useState(mapData.currentFloor);
  const [player, setPlayer] = useState<PreviewPlayer>({
    x: 0,
    y: 0,
    hp: 1000,
    attack: 10,
    defense: 10,
    gold: 0,
    yellowKeys: 1,
    blueKeys: 0,
    redKeys: 0
  });
  const [triggeredEventIds, setTriggeredEventIds] = useState<Set<string>>(() => new Set());
  const [customVars, setCustomVarsState] = useState<Record<string, unknown>>({});
  const [tileOverrides, setTileOverridesState] = useState<Map<string, Tile | null>>(() => new Map());
  const [defeatedMonsterKeys, setDefeatedMonsterKeys] = useState<Set<string>>(() => new Set());

  const [log, setLog] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [collectedItems, setCollectedItems] = useState<Set<string>>(new Set());
  const logScrollRef = useRef<HTMLDivElement>(null);

  const previewFloor = useMemo(
    () => mapData.floors.find((f: Floor) => f.floorId === previewFloorId),
    [mapData.floors, previewFloorId]
  );

  const addLog = useCallback((message: string) => {
    setLog(prev => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  const makeContext = useCallback(
    (patch?: {
      player?: PreviewPlayer;
      tileOverrides?: Map<string, Tile | null>;
      defeatedMonsterKeys?: Set<string>;
    }): PreviewContext => {
      return {
        mapData,
        floorId: previewFloorId,
        player: patch?.player ?? player,
        triggeredEventIds,
        customVars,
        tileOverrides: patch?.tileOverrides ?? tileOverrides,
        defeatedMonsterKeys: patch?.defeatedMonsterKeys ?? defeatedMonsterKeys,
        addLog,
        setPlayer,
        setFloorId: setPreviewFloorId,
        setTriggered: fn => setTriggeredEventIds(prev => fn(new Set(prev))),
        setCustomVars: fn => setCustomVarsState(fn),
        setTileOverrides: fn => setTileOverridesState(fn),
        setCollectedItems
      };
    },
    [
      mapData,
      previewFloorId,
      player,
      triggeredEventIds,
      customVars,
      tileOverrides,
      defeatedMonsterKeys,
      addLog
    ]
  );

  const previewTileAt = useCallback(
    (x: number, y: number, overrides?: Map<string, Tile | null>) => {
      const o = overrides ?? tileOverrides;
      const t = getPreviewTile(mapData, previewFloorId, x, y, o);
      if (t && isSyntheticFillTile(t)) return undefined;
      return t;
    },
    [mapData, previewFloorId, tileOverrides]
  );

  const getTileAt = useCallback(
    (x: number, y: number): Tile | undefined =>
      previewFloor ? previewTileAt(x, y) : undefined,
    [previewFloor, previewTileAt]
  );

  const resetPreviewSession = useCallback(() => {
    const floor = mapData.floors.find((f: Floor) => f.floorId === mapData.currentFloor);
    if (!floor?.playerStart) return;
    const p: PreviewPlayer = {
      x: floor.playerStart.x,
      y: floor.playerStart.y,
      hp: floor.playerStart.hp,
      attack: floor.playerStart.attack,
      defense: floor.playerStart.defense,
      gold: floor.playerStart.gold,
      yellowKeys: floor.playerStart.yellowKeys,
      blueKeys: floor.playerStart.blueKeys,
      redKeys: floor.playerStart.redKeys
    };
    setPreviewFloorId(mapData.currentFloor);
    setPlayer(p);
    setTriggeredEventIds(new Set());
    setCustomVarsState({});
    setTileOverridesState(new Map());
    setDefeatedMonsterKeys(new Set());
    setCollectedItems(new Set());
    setLog([]);
    setGameOver(false);

    const ctx: PreviewContext = {
      mapData,
      floorId: floor.floorId,
      player: p,
      triggeredEventIds: new Set(),
      customVars: {},
      tileOverrides: new Map(),
      defeatedMonsterKeys: new Set(),
      addLog,
      setPlayer,
      setFloorId: setPreviewFloorId,
      setTriggered: fn => setTriggeredEventIds(prev => fn(new Set(prev))),
      setCustomVars: fn => setCustomVarsState(fn),
      setTileOverrides: fn => setTileOverridesState(fn),
      setCollectedItems
    };
    runGameInitEvents(floor, ctx);
  }, [mapData, addLog]);

  useEffect(() => {
    if (open) {
      resetPreviewSession();
    }
  }, [open, resetPreviewSession]);

  const canMoveTo = useCallback(
    (x: number, y: number): boolean => {
      if (!previewFloor) return false;
      if (x < 0 || x >= previewFloor.mapWidth || y < 0 || y >= previewFloor.mapHeight) return false;

      const tile = getTileAt(x, y);
      if (!tile) return true;

      const preset = presetForMapTile(tile);
      if (!preset) return true;

      if (preset.tileType === 'door') {
        const keyType = tile.properties?.keyType || 'yellow';
        if (keyType === 'yellow' && player.yellowKeys > 0) return true;
        if (keyType === 'blue' && player.blueKeys > 0) return true;
        if (keyType === 'red' && player.redKeys > 0) return true;
        return false;
      }

      return preset.tileType !== 'terrain' || (tile.name !== 'wall' && tile.name !== 'airWall' && tile.name !== 'lava');
    },
    [previewFloor, getTileAt, player]
  );

  const runStepEvents = useCallback(
    (
      x: number,
      y: number,
      nextPlayer: PreviewPlayer,
      patch?: { tileOverrides?: Map<string, Tile | null>; defeatedMonsterKeys?: Set<string> }
    ) => {
      const overrides = patch?.tileOverrides ?? tileOverrides;
      const tile = previewTileAt(x, y, overrides);
      const ctx = makeContext({
        player: nextPlayer,
        tileOverrides: overrides,
        defeatedMonsterKeys: patch?.defeatedMonsterKeys ?? defeatedMonsterKeys
      });

      if (tile?.events?.length) {
        runEventsWithTrigger(tile.events, 'step_on_tile', ctx, { tileAt: tile });
      }
    },
    [previewTileAt, tileOverrides, defeatedMonsterKeys, makeContext]
  );

  const runBumpEvents = useCallback(
    (tx: number, ty: number, dx: number, dy: number) => {
      const tile = previewTileAt(tx, ty);
      if (!tile?.events?.length) return;
      const ctx = makeContext();
      const dir = bumpDirFromDelta(dx, dy);
      runEventsWithTrigger(tile.events, 'bump_tile', ctx, { tileAt: tile, bumpDirection: dir });
    },
    [previewTileAt, makeContext]
  );

  const runTalkEvents = useCallback(() => {
    const tile = previewTileAt(player.x, player.y);
    if (!tile?.events?.length) return;
    const preset = presetForMapTile(tile);
    if (preset?.tileType !== 'npc') {
      addLog('当前格没有可对话的 NPC');
      return;
    }
    const ctx = makeContext();
    runEventsWithTrigger(tile.events, 'talk_to_tile', ctx, { tileAt: tile });
  }, [previewTileAt, player.x, player.y, makeContext, addLog]);

  const handleMove = useCallback(
    (dx: number, dy: number) => {
      if (gameOver) return;

      const newX = player.x + dx;
      const newY = player.y + dy;

      if (!canMoveTo(newX, newY)) {
        runBumpEvents(newX, newY, dx, dy);
        addLog(`无法移动到 (${newX}, ${newY})`);
        return;
      }

      let next: PreviewPlayer = { ...player, x: newX, y: newY };
      const tile = previewTileAt(newX, newY);

      let monsterWon = false;
      let nextDefeated = defeatedMonsterKeys;
      let nextOverrides = tileOverrides;

      if (tile) {
        const preset = presetForMapTile(tile);

        if (preset?.tileType === 'door') {
          const keyType = tile.properties?.keyType || 'yellow';
          if (keyType === 'yellow') {
            next = { ...next, yellowKeys: next.yellowKeys - 1 };
            addLog('消耗黄钥匙，打开门');
          } else if (keyType === 'blue') {
            next = { ...next, blueKeys: next.blueKeys - 1 };
            addLog('消耗蓝钥匙，打开门');
          } else if (keyType === 'red') {
            next = { ...next, redKeys: next.redKeys - 1 };
            addLog('消耗红钥匙，打开门');
          }
        }

        if (preset?.tileType === 'item') {
          const key = `${previewFloorId}:${newX},${newY}`;
          addLog(`拾取了 ${preset.name}`);
          setCollectedItems(prev => new Set(prev).add(key));
          if (tile.name === 'hp' || tile.name === 'hplarge') {
            next = { ...next, hp: next.hp + (tile.name === 'hplarge' ? 200 : 100) };
          } else if (tile.name === 'attackgem') {
            next = { ...next, attack: next.attack + 5 };
          } else if (tile.name === 'defencegem') {
            next = { ...next, defense: next.defense + 5 };
          } else if (tile.name === 'yellowkey') {
            next = { ...next, yellowKeys: next.yellowKeys + 1 };
          } else if (tile.name === 'bluekey') {
            next = { ...next, blueKeys: next.blueKeys + 1 };
          } else if (tile.name === 'redkey') {
            next = { ...next, redKeys: next.redKeys + 1 };
          } else if (tile.name === 'gold' || tile.name === 'luckycoins') {
            next = { ...next, gold: next.gold + 100 };
          }
        }

        if (preset?.tileType === 'monster') {
          const monsterAttack = tile.properties?.attack || 10;
          const monsterDefense = tile.properties?.defense || 5;
          const damage = Math.max(0, monsterAttack - player.defense);
          next = { ...next, hp: next.hp - damage };
          addLog(`与 ${tile.properties?.name || preset.name} 战斗，受到 ${damage} 点伤害`);

          if (player.attack > monsterDefense) {
            addLog(`击败了 ${tile.properties?.name || preset.name}！`);
            monsterWon = true;
            nextDefeated = new Set(defeatedMonsterKeys);
            nextDefeated.add(previewMapCellKey(previewFloorId, newX, newY));
            const floorTile = makeTileFromType('floor', newX, newY, previewFloorId);
            nextOverrides = new Map(tileOverrides);
            if (floorTile) {
              nextOverrides.set(previewMapCellKey(previewFloorId, newX, newY), floorTile);
            }
          }
        }
      }

      let workPlayer = next;
      let workOverrides = tileOverrides;
      let stepPatch: { tileOverrides?: Map<string, Tile | null>; defeatedMonsterKeys?: Set<string> } | undefined;

      if (monsterWon) {
        setDefeatedMonsterKeys(nextDefeated);
        workOverrides = nextOverrides;
        if (previewFloor) {
          const ctxD = makeContext({
            player: next,
            defeatedMonsterKeys: nextDefeated,
            tileOverrides: workOverrides
          });
          const w = runEventsWithTriggerReturnWork(
            [...previewFloor.globalEvents, ...previewFloor.customEvents],
            'defeat_monster',
            ctxD,
            { defeatAt: { x: newX, y: newY, floorId: previewFloorId } }
          );
          workPlayer = w.player;
          workOverrides = w.tileOverrides;
        }
        stepPatch = { tileOverrides: workOverrides, defeatedMonsterKeys: nextDefeated };
      }

      setPlayer(workPlayer);
      addLog(`移动到 (${newX}, ${newY})`);
      runStepEvents(newX, newY, workPlayer, stepPatch);
    },
    [
      gameOver,
      player,
      canMoveTo,
      previewFloorId,
      previewFloor,
      tileOverrides,
      defeatedMonsterKeys,
      addLog,
      runBumpEvents,
      runStepEvents,
      previewTileAt,
      makeContext
    ]
  );

  const handleMoveRef = useRef(handleMove);
  handleMoveRef.current = handleMove;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'e') {
        e.preventDefault();
        runTalkEvents();
        return;
      }
      switch (k) {
        case 'w':
        case 'arrowup':
          handleMoveRef.current(0, -1);
          break;
        case 's':
        case 'arrowdown':
          handleMoveRef.current(0, 1);
          break;
        case 'a':
        case 'arrowleft':
          handleMoveRef.current(-1, 0);
          break;
        case 'd':
        case 'arrowright':
          handleMoveRef.current(1, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, runTalkEvents]);

  useEffect(() => {
    if (player.hp <= 0) {
      setGameOver(true);
      addLog('游戏结束：你死亡了');
    }
  }, [player.hp, addLog]);

  useEffect(() => {
    const el = logScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [log]);

  if (!previewFloor) return null;

  const { mapWidth, mapHeight } = previewFloor;
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

  const tilesForPreview = useMemo(
    () => stripSyntheticFillTiles(previewFloor.tiles),
    [previewFloor.tiles]
  );

  const renderTileSprites = () =>
    tilesForPreview.map((tile: Tile) => {
      const t = previewTileAt(tile.x, tile.y);
      if (!t) return null;
      const preset = presetForMapTile(t);
      const collectKey = `${previewFloorId}:${t.x},${t.y}`;
      const isCollected = collectedItems.has(collectKey);
      if (preset?.tileType === 'item' && isCollected) return null;

      const src = t.src || preset?.src;
      return (
        <div
          key={t.id}
          style={{
            position: 'absolute',
            left: t.x * TILE_SIZE,
            top: t.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            backgroundImage: src ? `url(${src})` : 'none',
            backgroundSize: 'cover',
            boxSizing: 'border-box',
            zIndex: 5
          }}
        >
          {t.events && t.events.length > 0 && (
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
              {'\u26A1'}
            </div>
          )}
        </div>
      );
    });

  const renderPlayer = () => (
    <div
      style={{
        position: 'absolute',
        left: player.x * TILE_SIZE,
        top: player.y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundImage: 'url(/images/builds/player_icon.png)',
        backgroundSize: 'cover',
        zIndex: 10,
        pointerEvents: 'none'
      }}
    />
  );

  return (
    <Modal
      title="预览模式"
      open={open}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              backgroundColor: '#1a1a2e',
              padding: 16,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: mapPixelHeight + 2 * TILE_SIZE + 32
            }}
          >
            <div style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)' }}>
              <MapBorderFrame mapPixelWidth={mapPixelWidth} mapPixelHeight={mapPixelHeight}>
                <div style={{ position: 'relative', width: mapPixelWidth, height: mapPixelHeight }}>
                  {renderBackground()}
                  {renderTileSprites()}
                  {renderPlayer()}
                </div>
              </MapBorderFrame>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 8, background: '#111', borderRadius: 4 }}>
            <h4 style={{ color: '#fff', marginBottom: 8 }}>操作说明</h4>
            <p style={{ color: '#888', fontSize: 12 }}>
              W/A/S/D 或方向键移动 · 空格 / E 与 NPC 对话（触发 talk_to_tile）
            </p>
          </div>
        </div>

        <div style={{ width: 200 }}>
          <div style={{ background: '#111', padding: 12, borderRadius: 4, marginBottom: 16 }}>
            <h4 style={{ color: '#fff', marginBottom: 8 }}>角色状态</h4>
            <div style={{ color: '#888', fontSize: 12 }}>
              <div>
                楼层: {previewFloorId} / {mapData.totalFloors}
              </div>
              <div>
                HP: <span style={{ color: player.hp < 100 ? '#ff4444' : '#00ff00' }}>{player.hp}</span>
              </div>
              <div>攻击: {player.attack}</div>
              <div>防御: {player.defense}</div>
              <div>金币: {player.gold}</div>
              <div>黄钥匙: {player.yellowKeys}</div>
              <div>蓝钥匙: {player.blueKeys}</div>
              <div>红钥匙: {player.redKeys}</div>
              <div>
                位置: ({player.x}, {player.y})
              </div>
            </div>
          </div>

          <div style={{ background: '#111', padding: 12, borderRadius: 4 }}>
            <h4 style={{ color: '#fff', marginBottom: 8 }}>操作日志</h4>
            <div ref={logScrollRef} style={{ maxHeight: 200, overflow: 'auto' }}>
              {log.map((entry, i) => (
                <div key={i} style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>
                  {entry}
                </div>
              ))}
            </div>
          </div>

          {gameOver && (
            <Alert
              type="error"
              message="游戏结束"
              description="你的生命值已经耗尽"
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PreviewMode;
