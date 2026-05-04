import propsJson from '../../docs/props.json';

export interface GiveItemPropOption {
  /** map_data / grant_item_by_name 使用的 prop 键（props.json 顶层 key） */
  value: string;
  /** 展示：中文 name + spriteId */
  label: string;
  spriteId: string;
}

function buildOptions(raw: Record<string, unknown>): GiveItemPropOption[] {
  const list: GiveItemPropOption[] = [];
  for (const [propKey, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const o = entry as Record<string, unknown>;
    const name = typeof o.name === 'string' && o.name.trim() ? o.name.trim() : propKey;
    const spriteId = typeof o.spriteId === 'string' ? o.spriteId.trim() : '';
    list.push({
      value: propKey,
      label: spriteId ? `${name} (${spriteId})` : name,
      spriteId
    });
  }
  return list.sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans-CN'));
}

/** 来自 docs/props.json，供 giveItem 多选下拉使用 */
export const GIVE_ITEM_PROP_OPTIONS: GiveItemPropOption[] = buildOptions(
  propsJson as Record<string, unknown>
);
