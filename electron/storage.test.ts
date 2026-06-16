// @vitest-environment node
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DATA_VERSION } from "../shared/defaults";
import type { AppState } from "../shared/types";
import { AppStateStorage } from "./storage";

let directory: string;
let filePath: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "shiguang-storage-"));
  filePath = join(directory, "app-state.json");
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

function state(title: string): AppState {
  return {
    version: DATA_VERSION,
    notes: [{ id: title, title, content: "内容", updatedAt: 1_234 }],
    activeId: title,
    theme: "light"
  };
}

describe("AppStateStorage", () => {
  it("returns defaults when the file does not exist", async () => {
    const result = await new AppStateStorage(filePath).load();
    expect(result.notes.length).toBeGreaterThan(0);
    expect(result.version).toBe(DATA_VERSION);
  });

  it("persists and loads a valid state", async () => {
    const storage = new AppStateStorage(filePath);
    await storage.save(state("第一篇"));
    expect(await storage.load()).toEqual(state("第一篇"));
  });

  it("serializes concurrent writes and keeps the newest state", async () => {
    const storage = new AppStateStorage(filePath);
    await Promise.all([storage.save(state("一")), storage.save(state("二")), storage.save(state("三"))]);
    const saved = JSON.parse(await readFile(filePath, "utf8")) as AppState;
    expect(saved.notes[0].title).toBe("三");
  });

  it("backs up corrupt data and recovers defaults", async () => {
    await writeFile(filePath, "{broken", "utf8");
    const result = await new AppStateStorage(filePath).load();
    const files = await readdir(directory);
    expect(result.notes.length).toBeGreaterThan(0);
    expect(files.some((name) => name.includes(".corrupt-") && name.endsWith(".bak"))).toBe(true);
  });
});
