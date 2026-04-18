export const MAP_TILE_PX = 32;

export type BorderSide =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'inner'
  | 'corner-tl'
  | 'corner-tr'
  | 'corner-bl'
  | 'corner-br';

export function getBorderSide(x: number, y: number, width: number, height: number): BorderSide {
  if (x === 0 && y === 0) return 'corner-tl';
  if (x === width - 1 && y === 0) return 'corner-tr';
  if (x === 0 && y === height - 1) return 'corner-bl';
  if (x === width - 1 && y === height - 1) return 'corner-br';
  if (y === 0) return 'top';
  if (y === height - 1) return 'bottom';
  if (x === 0) return 'left';
  if (x === width - 1) return 'right';
  return 'inner';
}

export function getBorderRotation(side: BorderSide): string {
  switch (side) {
    case 'top':
      return 'rotate(0deg)';
    case 'bottom':
      return 'rotate(180deg)';
    case 'left':
      return 'rotate(-90deg)';
    case 'right':
      return 'rotate(90deg)';
    case 'corner-tl':
      return 'rotate(0deg)';
    case 'corner-tr':
      return 'rotate(90deg)';
    case 'corner-bl':
      return 'rotate(-90deg)';
    case 'corner-br':
      return 'rotate(180deg)';
    default:
      return 'rotate(0deg)';
  }
}
