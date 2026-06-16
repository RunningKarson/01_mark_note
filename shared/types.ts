export type Theme = "light" | "dark";

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export interface AppState {
  version: number;
  notes: Note[];
  activeId: string | null;
  theme: Theme;
}

export interface DesktopApi {
  loadAppState(): Promise<AppState>;
  saveAppState(state: AppState): Promise<void>;
  setTitleBarTheme(theme: Theme): Promise<void>;
  onBeforeClose(callback: () => void | Promise<void>): () => void;
  confirmClose(): void;
}
