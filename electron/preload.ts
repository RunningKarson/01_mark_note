import { contextBridge, ipcRenderer } from "electron";
import type { AppState, DesktopApi, Theme } from "../shared/types";

const api: DesktopApi = {
  loadAppState: () => ipcRenderer.invoke("state:load"),
  saveAppState: (state: AppState) => ipcRenderer.invoke("state:save", state),
  setTitleBarTheme: (theme: Theme) => ipcRenderer.invoke("window:set-theme", theme),
  onBeforeClose: (callback) => {
    const listener = () => void callback();
    ipcRenderer.on("window:before-close", listener);
    return () => ipcRenderer.removeListener("window:before-close", listener);
  },
  confirmClose: () => ipcRenderer.send("window:close-ready")
};

contextBridge.exposeInMainWorld("desktop", api);
