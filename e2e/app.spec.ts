import { _electron as electron, expect, test, type ElectronApplication } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

let electronApp: ElectronApplication;
let userDataDir: string;
test.setTimeout(90_000);

async function launch() {
  return electron.launch({
    args: [".", `--user-data-dir=${userDataDir}`, "--disable-gpu", "--disable-software-rasterizer"],
    env: { ...process.env, NODE_ENV: "test" }
  });
}

async function closeElectronApp(app: ElectronApplication | undefined) {
  if (!app) return;
  await app.evaluate(({ app: electronApp, BrowserWindow }) => {
    BrowserWindow.getAllWindows().forEach((window) => window.destroy());
    electronApp.quit();
  }).catch(() => undefined);
  await app.close().catch(() => undefined);
}

test.beforeEach(async () => {
  userDataDir = await mkdtemp(join(tmpdir(), "shiguang-e2e-"));
  electronApp = await launch();
});

test.afterEach(async () => {
  await closeElectronApp(electronApp);
  await rm(userDataDir, { recursive: true, force: true });
});

test("persists notes and theme across restarts, then searches and deletes", async () => {
  let window = await electronApp.firstWindow();
  await expect(window.getByText("拾光笔记", { exact: true }).first()).toBeVisible();

  await window.getByRole("button", { name: "新建笔记" }).click();
  await window.getByLabel("笔记标题").fill("端到端笔记");
  await window.getByLabel("笔记内容").fill("重启后仍然存在");
  await window.getByRole("button", { name: "深色" }).click();
  await expect(window.getByText("已自动保存")).toBeVisible();
  await closeElectronApp(electronApp);

  electronApp = await launch();
  window = await electronApp.firstWindow();
  await expect(window.getByDisplayValue("端到端笔记")).toBeVisible();
  await expect(window.getByRole("button", { name: "深色" })).toHaveAttribute("aria-pressed", "true");

  await window.getByPlaceholder("搜索笔记...").fill("重启后");
  await expect(window.getByText("端到端笔记")).toBeVisible();
  window.on("dialog", (dialog) => dialog.accept());
  await window.getByRole("button", { name: "删除笔记" }).click();
  await expect(window.getByText("端到端笔记")).toHaveCount(0);
});
