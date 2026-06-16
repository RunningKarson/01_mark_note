import { createDefaultNotes, DATA_VERSION, RETIRED_SAMPLE_TITLES } from "./defaults";
import type { AppState, Note, Theme } from "./types";

export function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const note = value as Partial<Note>;
  return typeof note.id === "string"
    && typeof note.title === "string"
    && typeof note.content === "string"
    && typeof note.updatedAt === "number"
    && Number.isFinite(note.updatedAt);
}

export function normalizeState(value: unknown, now = Date.now()): AppState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AppState>;
  if (!Array.isArray(candidate.notes) || !candidate.notes.every(isNote)) return null;

  let notes = candidate.notes;
  const version = typeof candidate.version === "number" ? candidate.version : 1;
  if (version < DATA_VERSION) {
    const retained = notes.filter((note) => !RETIRED_SAMPLE_TITLES.has(note.title));
    const titles = new Set(retained.map((note) => note.title));
    const additions = createDefaultNotes(now).filter((note) => !titles.has(note.title));
    notes = [...retained, ...additions];
  }

  const theme: Theme = candidate.theme === "dark" ? "dark" : "light";
  const requestedActiveId = typeof candidate.activeId === "string" ? candidate.activeId : null;
  const activeId = notes.some((note) => note.id === requestedActiveId)
    ? requestedActiveId
    : notes[0]?.id ?? null;

  return { version: DATA_VERSION, notes, activeId, theme };
}

export function filterAndSortNotes(notes: Note[], searchTerm: string): Note[] {
  const term = searchTerm.trim().toLocaleLowerCase("zh-CN");
  return notes
    .filter((note) => `${note.title} ${note.content}`.toLocaleLowerCase("zh-CN").includes(term))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function countCharacters(content: string): number {
  return content.replace(/\s/g, "").length;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

export function relativeDate(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(timestamp);
}
