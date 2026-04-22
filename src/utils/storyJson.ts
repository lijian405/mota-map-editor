import type { StoryRoot } from '../types/story';

export function serializeStoryRoot(doc: StoryRoot): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

export function parseStoryJson(text: string): StoryRoot {
  const data = JSON.parse(text) as unknown;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('根对象必须是 JSON 对象');
  }
  const stories = (data as { stories?: unknown }).stories;
  if (!Array.isArray(stories)) {
    throw new Error('缺少 stories 数组');
  }
  return data as StoryRoot;
}
