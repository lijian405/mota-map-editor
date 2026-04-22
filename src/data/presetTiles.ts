import { PresetTile } from '../types';

export const presetTiles: PresetTile[] = [
  { name: 'wall', type: 'wall', tileType: 'terrain', layer: 'terrain', src: '/images/builds/wall.png' },
  { name: 'floor', type: 'floor', tileType: 'terrain', layer: 'terrain', src: '/images/builds/floor.png' },
  { name: 'airWall', type: 'airWall', tileType: 'terrain', layer: 'terrain', src: '/images/builds/airWall.png' },
  { name: 'lava', type: 'lava', tileType: 'terrain', layer: 'terrain', src: '/images/builds/lava.png' },
  { name: 'rail', type: 'rail', tileType: 'terrain', layer: 'terrain', src: '/images/builds/rail.png' },
  { name: 'stairs_up', type: 'up', tileType: 'terrain', layer: 'terrain', src: '/images/builds/up.png' },
  { name: 'stairs_down', type: 'down', tileType: 'terrain', layer: 'terrain', src: '/images/builds/down.png' },
  { name: 'shopLeft', type: 'shopLeft', tileType: 'terrain', layer: 'terrain', src: '/images/builds/shopLeft.png' },
  { name: 'shopCenter', type: 'shopCenter', tileType: 'terrain', layer: 'terrain', src: '/images/builds/shopCenter.png' },
  { name: 'shopRight', type: 'shopRight', tileType: 'terrain', layer: 'terrain', src: '/images/builds/shopRight.png' },
  { name: 'yellowgate', type: 'yellowgate', tileType: 'door', layer: 'object', src: '/images/builds/yellowgate.png' },
  { name: 'bluegate', type: 'bluegate', tileType: 'door', layer: 'object', src: '/images/builds/bluegate.png' },
  { name: 'redgate', type: 'redgate', tileType: 'door', layer: 'object', src: '/images/builds/redgate.png' },
  { name: 'greengate', type: 'greengate', tileType: 'door', layer: 'object', src: '/images/builds/greengate.png' },
  { name: 'yellowkey', type: 'yellowkey', tileType: 'item', layer: 'object', src: '/images/items/yellowkey.png' },
  { name: 'bluekey', type: 'bluekey', tileType: 'item', layer: 'object', src: '/images/items/bluekey.png' },
  { name: 'redkey', type: 'redkey', tileType: 'item', layer: 'object', src: '/images/items/redkey.png' },
  { name: 'attackgem', type: 'attackgem', tileType: 'item', layer: 'object', src: '/images/items/attackgem.png' },
  { name: 'defencegem', type: 'defencegem', tileType: 'item', layer: 'object', src: '/images/items/defencegem.png' },
  { name: 'hp', type: 'hp', tileType: 'item', layer: 'object', src: '/images/items/hp.png' },
  { name: 'hplarge', type: 'hplarge', tileType: 'item', layer: 'object', src: '/images/items/hplarge.png' },
  { name: 'luckycoins', type: 'luckycoins', tileType: 'item', layer: 'object', src: '/images/items/luckycoins.png' },
  { name: 'magickey', type: 'magickey', tileType: 'item', layer: 'object', src: '/images/items/magickey.png' },
  { name: 'chuansong', type: 'chuansong', tileType: 'item', layer: 'object', src: '/images/items/chuansong.png' },
  { name: 'notepad', type: 'notepad', tileType: 'item', layer: 'object', src: '/images/items/notepad.png' },
  { name: 'tiejian', type: 'tiejian', tileType: 'item', layer: 'object', src: '/images/items/tiejian.png' },
  { name: 'tiedun', type: 'tiedun', tileType: 'item', layer: 'object', src: '/images/items/tiedun.png' },
  { name: 'yinjian', type: 'yinjian', tileType: 'item', layer: 'object', src: '/images/items/yinjian.png' },
  { name: 'yindun', type: 'yindun', tileType: 'item', layer: 'object', src: '/images/items/yindun.png' },
  { name: 'qishijian', type: 'qishijian', tileType: 'item', layer: 'object', src: '/images/items/qishijian.png' },
  { name: 'qishidun', type: 'qishidun', tileType: 'item', layer: 'object', src: '/images/items/qishidun.png' },
  { name: 'shengjian', type: 'shengjian', tileType: 'item', layer: 'object', src: '/images/items/shengjian.png' },
  { name: 'shengdun', type: 'shengdun', tileType: 'item', layer: 'object', src: '/images/items/shengdun.png' },
  { name: 'shenshengjian', type: 'shenshengjian', tileType: 'item', layer: 'object', src: '/images/items/shenshengjian.png' },
  { name: 'shenshengdun', type: 'shenshengdun', tileType: 'item', layer: 'object', src: '/images/items/shenshengdun.png' },
  { name: 'thief', type: 'thief', tileType: 'npc', layer: 'object', src: '/images/npc/thief.png' },
  { name: 'wise', type: 'wise', tileType: 'npc', layer: 'object', src: '/images/npc/wise.png' },
  { name: 'business', type: 'business', tileType: 'npc', layer: 'object', src: '/images/npc/business.png' }
];

for (let i = 100; i < 133; i++) {
  presetTiles.push({
    name:  i.toString(),
    type: 'monster',
    tileType: 'monster',
    layer: 'object',
    src: '/images/monsters/'+i + '.png'
  });
}

export const tileCategories = [
  { key: 'terrain', label: '地形' },
  { key: 'door', label: '门' },
  { key: 'item', label: '道具' },
  { key: 'monster', label: '怪物' },
  { key: 'npc', label: 'NPC' }
];