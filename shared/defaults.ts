import type { AppState, Note } from "./types";

export const DATA_VERSION = 3;

export const RETIRED_SAMPLE_TITLES = new Set([
  "旅行清单",
  "会议记录",
  "想看的电影",
  "生活备忘"
]);

export function createDefaultNotes(now = Date.now()): Note[] {
  return [
    {
      id: crypto.randomUUID(),
      title: "欢迎使用拾光笔记",
      content: "在左侧选择一篇笔记，在右侧自由书写。\n\n你的内容会自动保存在电脑中，即使关闭应用也不会丢失。",
      updatedAt: now
    },
    {
      id: crypto.randomUUID(),
      title: "今日灵感",
      content: "好的想法往往来得很轻，记得及时把它留下来。",
      updatedAt: now - 86_400_000
    },
    {
      id: crypto.randomUUID(),
      title: "本周计划",
      content: "1. 整理工作清单\n2. 完成阅读计划\n3. 周末去公园散步\n4. 给家人打个电话",
      updatedAt: now - 2 * 86_400_000
    },
    {
      id: crypto.randomUUID(),
      title: "阅读摘录",
      content: "阅读不是为了记住所有内容，而是让一些思想在心里停留得更久。",
      updatedAt: now - 3 * 86_400_000
    }
  ];
}

export function createDefaultState(now = Date.now()): AppState {
  const notes = createDefaultNotes(now);
  return {
    version: DATA_VERSION,
    notes,
    activeId: notes[0]?.id ?? null,
    theme: "light"
  };
}
