import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createDefaultState } from "../shared/defaults";
import { normalizeState } from "../shared/domain";
import type { AppState } from "../shared/types";

export class AppStateStorage {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async load(): Promise<AppState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const state = normalizeState(JSON.parse(raw));
      if (!state) throw new Error("Invalid application state");
      return state;
    } catch (error) {
      if (isMissingFile(error)) return createDefaultState();
      await this.backupCorruptFile();
      return createDefaultState();
    }
  }

  save(state: AppState): Promise<void> {
    const normalized = normalizeState(state);
    if (!normalized) return Promise.reject(new Error("Refusing to save invalid application state"));

    const operation = this.writeQueue.then(async () => {
      await mkdir(dirname(this.filePath), { recursive: true });
      const temporaryPath = `${this.filePath}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
      await rename(temporaryPath, this.filePath);
    });
    this.writeQueue = operation.catch(() => undefined);
    return operation;
  }

  private async backupCorruptFile(): Promise<void> {
    try {
      await copyFile(this.filePath, `${this.filePath}.corrupt-${Date.now()}.bak`);
    } catch {
      // Recovery should still continue when a backup cannot be created.
    }
  }
}

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT");
}
