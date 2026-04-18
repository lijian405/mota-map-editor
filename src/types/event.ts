export type TriggerType =
  | 'step_on_tile'
  | 'bump_tile'
  | 'talk_to_tile'
  | 'use_item'
  | 'defeat_monster'
  | 'game_init'
  | 'stat_change'
  | 'time_trigger'
  | 'custom_event'
  | 'key_change'
  | 'floor_change';

export type ConditionType =
  | 'has_item'
  | 'stat_require'
  | 'key_count'
  | 'event_triggered'
  | 'monster_defeat_count'
  /** 指定楼层若干格上的怪物均已击败（用于多门联动、守门等） */
  | 'monsters_at_defeated'
  | 'current_floor'
  | 'custom_variable'
  | 'random_probability';

export type ActionType =
  | 'get_item'
  | 'change_stat'
  | 'consume_item'
  | 'consume_key'
  | 'change_tile'
  | 'teleport_player'
  | 'change_floor'
  | 'show_dialog'
  | 'show_hint'
  | 'trigger_custom_event'
  | 'set_custom_variable'
  | 'play_sound'
  | 'shake_screen'
  | 'lock_player'
  | 'unlock_player'
  | 'game_victory'
  | 'game_failure'
  | 'no_op';

export type ConditionLogic = 'and' | 'or';

export type BumpDirection = 'up' | 'down' | 'left' | 'right' | 'any';

export interface Trigger {
  type: TriggerType;
  params?: Record<string, unknown> & {
    direction?: BumpDirection;
  };
}

export interface Condition {
  type: ConditionType;
  params?: Record<string, unknown>;
}

export interface Action {
  type: ActionType;
  delay?: number;
  params?: Record<string, unknown>;
}

export interface GameEvent {
  eventId: string;
  trigger: Trigger;
  conditions: Condition[];
  conditionLogic: ConditionLogic;
  conditionFailText?: string;
  actions: Action[];
  nextEvent?: string;
}
