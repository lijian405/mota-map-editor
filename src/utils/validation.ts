import { Floor } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  floorId?: number;
  position?: { x: number; y: number };
}

export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  floorId?: number;
}

export const validateMap = (floors: Floor[]): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  floors.forEach(floor => {
    if (floor.tiles.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'W001',
        message: `第 ${floor.floorId} 层没有放置任何 Tile`,
        floorId: floor.floorId
      });
    }

    const hasStairsUp = floor.stairs.up !== null;
    const hasStairsDown = floor.stairs.down !== null;

    if (floor.floorId < floors.length - 1 && !hasStairsUp) {
      warnings.push({
        type: 'warning',
        code: 'W002',
        message: `第 ${floor.floorId} 层没有设置上楼楼梯`,
        floorId: floor.floorId
      });
    }

    if (floor.floorId > 0 && !hasStairsDown) {
      warnings.push({
        type: 'warning',
        code: 'W003',
        message: `第 ${floor.floorId} 层没有设置下楼楼梯`,
        floorId: floor.floorId
      });
    }

    floor.tiles.forEach(tile => {
      if (tile.tileType === 'monster') {
        if (tile.properties.hp !== undefined && tile.properties.hp < 0) {
          errors.push({
            type: 'error',
            code: 'E001',
            message: `第 ${floor.floorId} 层怪物 "${tile.properties.name || tile.name}" 生命值为负数`,
            floorId: floor.floorId,
            position: { x: tile.x, y: tile.y }
          });
        }
        if (tile.properties.attack !== undefined && tile.properties.attack < 0) {
          errors.push({
            type: 'error',
            code: 'E002',
            message: `第 ${floor.floorId} 层怪物 "${tile.properties.name || tile.name}" 攻击力为负数`,
            floorId: floor.floorId,
            position: { x: tile.x, y: tile.y }
          });
        }
        if (tile.properties.defense !== undefined && tile.properties.defense < 0) {
          errors.push({
            type: 'error',
            code: 'E003',
            message: `第 ${floor.floorId} 层怪物 "${tile.properties.name || tile.name}" 防御力为负数`,
            floorId: floor.floorId,
            position: { x: tile.x, y: tile.y }
          });
        }
      }
    });

    const doorCount = floor.tiles.filter(t => t.tileType === 'door').length;
    const keyCount = floor.tiles.filter(t =>
      t.name === 'yellowkey' || t.name === 'bluekey' || t.name === 'redkey'
    ).length;

    if (doorCount > 0 && keyCount === 0) {
      warnings.push({
        type: 'warning',
        code: 'W004',
        message: `第 ${floor.floorId} 层有 ${doorCount} 个门但没有放置钥匙`,
        floorId: floor.floorId
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};