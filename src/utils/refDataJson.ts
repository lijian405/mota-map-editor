/** 从策划导出的 event.json / prop.json 提取引用键，供校验 */

export function extractEventKeys(data: unknown): string[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  return Object.keys(data as Record<string, unknown>);
}

export function extractPropNames(data: unknown): string[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    const names: string[] = [];
    for (const item of data) {
      if (item && typeof item === 'object' && 'name' in item && item.name != null) {
        names.push(String(item.name));
      }
    }
    return names;
  }
  if (typeof data === 'object') return Object.keys(data as Record<string, unknown>);
  return [];
}
