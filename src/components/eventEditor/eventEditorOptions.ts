import type { TriggerType, ConditionType, ActionType, BumpDirection } from '../../types';

export const triggerOptions: { value: TriggerType; label: string }[] = [
  { value: 'step_on_tile', label: '玩家踩上 Tile' },
  { value: 'bump_tile', label: '玩家碰撞 Tile' },
  { value: 'talk_to_tile', label: '与 Tile 对话' },
  { value: 'use_item', label: '使用道具' },
  { value: 'defeat_monster', label: '击败怪物' },
  { value: 'game_init', label: '游戏初始化' },
  { value: 'stat_change', label: '属性变化' },
  { value: 'time_trigger', label: '时间触发' },
  { value: 'custom_event', label: '自定义事件' },
  { value: 'key_change', label: '钥匙数量变化' },
  { value: 'floor_change', label: '楼层切换' }
];

export const conditionOptions: { value: ConditionType; label: string }[] = [
  { value: 'has_item', label: '拥有道具' },
  { value: 'stat_require', label: '属性要求' },
  { value: 'key_count', label: '钥匙数量' },
  { value: 'event_triggered', label: '事件触发状态' },
  { value: 'monster_defeat_count', label: '怪物击败数量' },
  {
    value: 'monsters_at_defeated',
    label: '指定格怪物已击败'
  },
  { value: 'current_floor', label: '当前楼层' },
  { value: 'custom_variable', label: '自定义变量' },
  { value: 'random_probability', label: '随机概率' }
];

export const actionOptions: { value: ActionType; label: string }[] = [
  { value: 'get_item', label: '获得道具' },
  { value: 'change_stat', label: '改变属性' },
  { value: 'consume_item', label: '消耗道具' },
  { value: 'consume_key', label: '消耗钥匙' },
  { value: 'change_tile', label: '改变 Tile' },
  { value: 'teleport_player', label: '传送玩家' },
  { value: 'change_floor', label: '切换楼层' },
  { value: 'show_dialog', label: '显示对话' },
  { value: 'show_hint', label: '显示提示' },
  { value: 'trigger_custom_event', label: '触发自定义事件' },
  { value: 'set_custom_variable', label: '设置自定义变量' },
  { value: 'play_sound', label: '播放音效' },
  { value: 'shake_screen', label: '震动屏幕' },
  { value: 'lock_player', label: '锁定玩家' },
  { value: 'unlock_player', label: '解锁玩家' },
  { value: 'game_victory', label: '游戏胜利' },
  { value: 'game_failure', label: '游戏失败' },
  { value: 'no_op', label: '无操作' }
];

export const bumpDirectionOptions: { value: BumpDirection; label: string }[] = [
  { value: 'any', label: '任意方向' },
  { value: 'up', label: '从上方' },
  { value: 'down', label: '从下方' },
  { value: 'left', label: '从左方' },
  { value: 'right', label: '从右方' }
];

export const conditionLogicOptions = [
  { value: 'and' as const, label: '与 (AND)' },
  { value: 'or' as const, label: '或 (OR)' }
];

export const triggerLabelMap: Record<string, string> = Object.fromEntries(
  triggerOptions.map((o) => [o.value, o.label])
);
