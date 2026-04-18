import { GameEvent } from '../types';

export interface EventTemplate {
  id: string;
  name: string;
  description: string;
  event: Partial<GameEvent>;
}

export const eventTemplates: EventTemplate[] = [
  {
    id: 'template_1',
    name: '踩踏板开门',
    description: '消耗钥匙 → 开门 → 提示',
    event: {
      trigger: { type: 'step_on_tile' },
      conditions: [
        { type: 'key_count', params: { color: 'yellow', comparator: '>=', count: 1 } }
      ],
      conditionLogic: 'and',
      conditionFailText: '你需要钥匙！',
      actions: [
        { type: 'consume_key', params: { color: 'yellow', count: 1 } },
        { type: 'change_tile', params: { targetX: 0, targetY: 0, newTileType: 'floor' } },
        { type: 'show_hint', params: { text: '门开了！' } }
      ]
    }
  },
  {
    id: 'template_2',
    name: 'NPC对话给道具',
    description: '对话 → 获得道具 → 标记事件已触发',
    event: {
      trigger: { type: 'talk_to_tile' },
      conditions: [
        { type: 'event_triggered', params: { eventId: '', status: 'not_triggered' } }
      ],
      conditionLogic: 'and',
      conditionFailText: '你已经和我聊过了！',
      actions: [
        { type: 'lock_player' },
        { type: 'show_dialog', params: { text: '这是给你的礼物！', avatar: '' } },
        { type: 'unlock_player', delay: 2000 },
        { type: 'get_item', params: { itemType: 'yellowkey', count: 1 } },
        { type: 'show_hint', params: { text: '获得黄钥匙×1' } },
        { type: 'trigger_custom_event', params: { eventId: '' } }
      ]
    }
  },
  {
    id: 'template_3',
    name: '击败怪物解锁隐藏墙',
    description: '击败怪物 → 墙变地板 → 提示（触发器可填 x/y/floorId 绑定指定怪；不写则任意击败都触发）',
    event: {
      trigger: { type: 'defeat_monster', params: { x: 0, y: 0 } },
      conditions: [],
      conditionLogic: 'and',
      actions: [
        { type: 'change_tile', params: { targetX: 0, targetY: 0, newTileType: 'floor' } },
        { type: 'show_hint', params: { text: '隐藏墙消失了！' } }
      ]
    }
  },
  {
    id: 'template_4',
    name: '属性不足无法通过',
    description: '检查攻击力 → 不满足则显示提示并传送回原地',
    event: {
      trigger: { type: 'step_on_tile' },
      conditions: [
        { type: 'stat_require', params: { stat: 'attack', comparator: '>=', value: 50 } }
      ],
      conditionLogic: 'and',
      conditionFailText: '你的攻击力不足！',
      actions: [
        { type: 'show_hint', params: { text: '攻击力不足，无法通过！' } },
        { type: 'teleport_player', params: { x: 0, y: 0 } }
      ]
    }
  },
  {
    id: 'template_5',
    name: '拾取道具',
    description: '踩上 → 获得道具 → Tile 消失',
    event: {
      trigger: { type: 'step_on_tile' },
      conditions: [],
      conditionLogic: 'and',
      actions: [
        { type: 'get_item', params: { itemType: 'hp', count: 1 } },
        { type: 'change_tile', params: { newTileType: 'floor' } },
        { type: 'show_hint', params: { text: '生命+100' } }
      ]
    }
  },
  {
    id: 'template_6',
    name: 'HP过低警告',
    description: '当 HP ≤ 100 时显示警告提示',
    event: {
      trigger: { type: 'stat_change', params: { stat: 'hp', comparator: '<=' } },
      conditions: [
        { type: 'stat_require', params: { stat: 'hp', comparator: '<=', value: 100 } }
      ],
      conditionLogic: 'and',
      actions: [
        { type: 'show_hint', params: { text: '警告：HP过低！请及时补充！' } }
      ]
    }
  },
  {
    id: 'template_7',
    name: '传送点',
    description: '踩上传送点 → 传送到指定位置',
    event: {
      trigger: { type: 'step_on_tile' },
      conditions: [],
      conditionLogic: 'and',
      actions: [
        { type: 'teleport_player', params: { floorId: 1, x: 5, y: 5 } },
        { type: 'show_hint', params: { text: '你被传送了！' } }
      ]
    }
  },
  {
    id: 'template_8',
    name: '商店交互',
    description: '与 NPC 对话 → 显示商品列表 → 购买',
    event: {
      trigger: { type: 'talk_to_tile' },
      conditions: [],
      conditionLogic: 'and',
      actions: [
        { type: 'lock_player' },
        { type: 'show_dialog', params: { text: '欢迎光临！请问需要什么？', avatar: 'business' } },
        { type: 'unlock_player' }
      ]
    }
  },
  {
    id: 'template_9',
    name: '触发陷阱',
    description: '踩上陷阱 → 扣血 → 显示提示',
    event: {
      trigger: { type: 'step_on_tile' },
      conditions: [],
      conditionLogic: 'and',
      actions: [
        { type: 'change_stat', params: { stat: 'hp', operation: '-', value: 100 } },
        { type: 'show_hint', params: { text: '你受到了100点伤害！' } },
        { type: 'shake_screen', params: { intensity: 'medium', duration: 500 } }
      ]
    }
  },
  {
    id: 'template_10',
    name: '游戏胜利',
    description: '触发胜利结局',
    event: {
      trigger: { type: 'step_on_tile' },
      conditions: [],
      conditionLogic: 'and',
      actions: [
        { type: 'show_dialog', params: { text: '恭喜你通关了！', avatar: '' } },
        { type: 'game_victory', params: { text: '恭喜通关魔塔！' } }
      ]
    }
  },
  {
    id: 'template_11',
    name: '清怪后门可通行（顶门）',
    description:
      '顶门时检查本层若干格怪物是否均已击败；满足则把门格改为地板。请改 positions 为守怪坐标、change_tile 为门格坐标。',
    event: {
      trigger: { type: 'bump_tile', params: { direction: 'any' } },
      conditions: [
        {
          type: 'monsters_at_defeated',
          params: {
            positions: [
              { x: 0, y: 0 },
              { x: 1, y: 1 }
            ]
          }
        }
      ],
      conditionLogic: 'and',
      conditionFailText: '还有怪物没消灭，门纹丝不动。',
      actions: [
        { type: 'change_tile', params: { targetX: 0, targetY: 0, newTileType: 'floor' } },
        { type: 'show_hint', params: { text: '门开了！' } }
      ]
    }
  },
  {
    id: 'template_12',
    name: '击败指定怪开多扇门',
    description:
      '仅当击败触发器坐标上的怪物时执行；可追加多条 change_tile 同时打开多扇门（每扇门改 targetX/targetY）。',
    event: {
      trigger: { type: 'defeat_monster', params: { x: 0, y: 0 } },
      conditions: [],
      conditionLogic: 'and',
      actions: [
        { type: 'change_tile', params: { targetX: 0, targetY: 0, newTileType: 'floor' } },
        { type: 'change_tile', params: { targetX: 0, targetY: 0, newTileType: 'floor' } },
        { type: 'show_hint', params: { text: '封印解除了！' } }
      ]
    }
  },
  {
    id: 'template_13',
    name: '本层清场后开门（击败任意怪检测）',
    description:
      '每次击败怪物后触发；仅当 positions 中全部怪格已击败时才开门。适合「杀光再开」的多怪联动。',
    event: {
      trigger: { type: 'defeat_monster', params: { matchAny: true } },
      conditions: [
        {
          type: 'monsters_at_defeated',
          params: {
            positions: [
              { x: 0, y: 0 },
              { x: 1, y: 0 }
            ]
          }
        }
      ],
      conditionLogic: 'and',
      actions: [
        { type: 'change_tile', params: { targetX: 0, targetY: 0, newTileType: 'floor' } },
        { type: 'show_hint', params: { text: '守卫已清，道路畅通。' } }
      ]
    }
  },
  {
    id: 'template_14',
    name: '按击败数量开门',
    description:
      '本层累计击败怪物数达到要求时触发（可与 step_on_tile / bump_tile 等组合）。需改 count、comparator。',
    event: {
      trigger: { type: 'step_on_tile' },
      conditions: [
        { type: 'monster_defeat_count', params: { count: 3, comparator: '>=' } }
      ],
      conditionLogic: 'and',
      conditionFailText: '消灭的魔物还不够。',
      actions: [
        { type: 'change_tile', params: { targetX: 0, targetY: 0, newTileType: 'floor' } },
        { type: 'show_hint', params: { text: '足够强大了，障碍消失。' } }
      ]
    }
  }
];