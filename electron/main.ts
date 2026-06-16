import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";
import { join } from "node:path";
import type { AppState, Theme } from "../shared/types";
import { AppStateStorage } from "./storage";

let mainWindow: BrowserWindow | null = null;
let closingConfirmed = false;
let storage: AppStateStorage;

if (process.env.NODE_ENV === "test") {
  app.disableHardwareAcceleration();
}

function titleBarOverlay(theme: Theme) {
  return theme === "dark"
    ? { color: "#171918", symbolColor: "#f0ede6", height: 36 }
    : { color: "#f3f1ec", symbolColor: "#272521", height: 36 };
}

async function createWindow(): Promise<void> {
  const initialState = await storage.load();
  nativeTheme.themeSource = initialState.theme;
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: initialState.theme === "dark" ? "#171918" : "#f3f1ec",
    title: "拾光笔记",
    titleBarStyle: "hidden",
    titleBarOverlay: titleBarOverlay(initialState.theme),
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.on("close", (event) => {
    if (process.env.NODE_ENV === "test") return;
    if (closingConfirmed) return;
    event.preventDefault();
    mainWindow?.webContents.send("window:before-close");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    closingConfirmed = false;
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    await mainWindow.loadFile(join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(async () => {
  storage = new AppStateStorage(join(app.getPath("userData"), "app-state.json"));

  ipcMain.handle("state:load", () => storage.load());
  ipcMain.handle("state:save", (_event, state: AppState) => storage.save(state));
  ipcMain.handle("window:set-theme", (_event, theme: Theme) => {
    if (theme !== "light" && theme !== "dark") return;
    nativeTheme.themeSource = theme;
    mainWindow?.setTitleBarOverlay(titleBarOverlay(theme));
    mainWindow?.setBackgroundColor(theme === "dark" ? "#171918" : "#f3f1ec");
  });
  ipcMain.on("window:close-ready", () => {
    closingConfirmed = true;
    mainWindow?.close();
  });

  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
