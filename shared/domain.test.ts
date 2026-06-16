import { describe, expect, it, vi } from "vitest";
import { DATA_VERSION } from "./defaults";
import { countCharacters, filterAndSortNotes, normalizeState, relativeDate } from "./domain";
import type { Note } from "./types";

const notes: Note[] = [
  { id: "old", title: "工作清单", content: "完成测试", updatedAt: 10 },
  { id: "new", title: "灵感", content: "新的工作想法", updatedAt: 20 }
];

describe("note domain", () => {
  it("filters title and content then sorts newest first", () => {
    expect(filterAndSortNotes(notes, "工作").map((note) => note.id)).toEqual(["new", "old"]);
    expect(filterAndSortNotes(notes, "灵感").map((note) => note.id)).toEqual(["new"]);
  });

  it("counts non-whitespace characters", () => {
    expect(countCharacters("拾光 notes\n 123")).toBe(10);
  });

  it("normalizes active note and theme", () => {
    expect(normalizeState({
      version: DATA_VERSION,
      notes,
      activeId: "missing",
      theme: "unexpected"
    })).toEqual({
      version: DATA_VERSION,
      notes,
      activeId: "old",
      theme: "light"
    });
  });

  it("upgrades retired sample data", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => `id-${Math.random()}`) });
    const result = normalizeState({
      version: 1,
      notes: [{ id: "retired", title: "旅行清单", content: "", updatedAt: 1 }],
      activeId: "retired",
      theme: "dark"
    }, 1_000);
    expect(result?.version).toBe(DATA_VERSION);
    expect(result?.notes.some((note) => note.title === "旅行清单")).toBe(false);
    expect(result?.notes.some((note) => note.title === "欢迎使用拾光笔记")).toBe(true);
    vi.unstubAllGlobals();
  });

  it("formats relative time buckets", () => {
    expect(relativeDate(99_000, 100_000)).toBe("刚刚");
    expect(relativeDate(40_000, 100_000)).toBe("1 分钟前");
    expect(relativeDate(100_000 - 7_200_000, 100_000)).toBe("2 小时前");
  });
});
