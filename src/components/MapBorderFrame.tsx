import type { CSSProperties } from 'react';
import { MAP_TILE_PX, getBorderRotation, type BorderSide } from '../utils/mapBoardGeometry';

const BORDER = MAP_TILE_PX;
const BORDER_IMG = '/images/border.png';

interface MapBorderFrameProps {
  mapPixelWidth: number;
  mapPixelHeight: number;
  children: React.ReactNode;
}

function Corner({ side, left, top }: { side: BorderSide; left: number; top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: BORDER,
        height: BORDER,
        backgroundImage: `url(${BORDER_IMG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        imageRendering: 'pixelated',
        transform: getBorderRotation(side),
        transformOrigin: 'center center',
        zIndex: 2
      }}
    />
  );
}

/**
 * 在地图矩形外圈铺一圈 border.png，不占用地图逻辑坐标。
 */
export function MapBorderFrame({ mapPixelWidth, mapPixelHeight, children }: MapBorderFrameProps) {
  const W = mapPixelWidth + 2 * BORDER;
  const H = mapPixelHeight + 2 * BORDER;

  const edge: CSSProperties = {
    position: 'absolute',
    backgroundImage: `url(${BORDER_IMG})`,
    backgroundRepeat: 'repeat',
    backgroundSize: `${BORDER}px ${BORDER}px`,
    imageRendering: 'pixelated',
    zIndex: 1
  };

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <Corner side="corner-tl" left={0} top={0} />
      <Corner side="corner-tr" left={W - BORDER} top={0} />
      <Corner side="corner-bl" left={0} top={H - BORDER} />
      <Corner side="corner-br" left={W - BORDER} top={H - BORDER} />

      <div
        style={{
          ...edge,
          left: BORDER,
          top: 0,
          width: mapPixelWidth,
          height: BORDER,
          backgroundRepeat: 'repeat-x'
        }}
      />
      <div
        style={{
          ...edge,
          left: BORDER,
          top: H - BORDER,
          width: mapPixelWidth,
          height: BORDER,
          backgroundRepeat: 'repeat-x'
        }}
      />
      <div
        style={{
          ...edge,
          left: 0,
          top: BORDER,
          width: BORDER,
          height: mapPixelHeight,
          backgroundRepeat: 'repeat-y'
        }}
      />
      <div
        style={{
          ...edge,
          left: W - BORDER,
          top: BORDER,
          width: BORDER,
          height: mapPixelHeight,
          backgroundRepeat: 'repeat-y'
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: BORDER,
          top: BORDER,
          width: mapPixelWidth,
          height: mapPixelHeight,
          overflow: 'hidden',
          zIndex: 0
        }}
      >
        {children}
      </div>
    </div>
  );
}
