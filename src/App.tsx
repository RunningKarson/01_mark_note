import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createDefaultState, DATA_VERSION } from "../shared/defaults";
import { filterAndSortNotes } from "../shared/domain";
import type { AppState, Note, Theme } from "../shared/types";
import { Editor, type SaveStatus } from "./components/Editor";
import { Sidebar } from "./components/Sidebar";
import { TitleBar } from "./components/TitleBar";

const SAVE_DELAY = 350;

export function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const stateRef = useRef<AppState | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirtyRef = useRef(false);

  const persist = useCallback(async (nextState?: AppState) => {
    const value = nextState ?? stateRef.current;
    if (!value) return;
    clearTimeout(saveTimerRef.current);
    try {
      await window.desktop.saveAppState(value);
      dirtyRef.current = false;
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, []);

  const updateState = useCallback((updater: (current: AppState) => AppState, immediate = false) => {
    setState((current) => {
      if (!current) return current;
      const next = updater(current);
      stateRef.current = next;
      dirtyRef.current = true;
      setSaveStatus("saving");
      clearTimeout(saveTimerRef.current);
      if (immediate) void persist(next);
      else saveTimerRef.current = setTimeout(() => void persist(next), SAVE_DELAY);
      return next;
    });
  }, [persist]);

  useEffect(() => {
    let active = true;
    void window.desktop.loadAppState()
      .catch(() => createDefaultState())
      .then((loaded) => {
        if (!active) return;
        stateRef.current = loaded;
        setState(loaded);
        document.documentElement.dataset.theme = loaded.theme;
        void window.desktop.setTitleBarTheme(loaded.theme);
      });

    const unsubscribe = window.desktop.onBeforeClose(async () => {
      if (dirtyRef.current) await persist();
      window.desktop.confirmClose();
    });
    return () => {
      active = false;
      clearTimeout(saveTimerRef.current);
      unsubscribe();
    };
  }, [persist]);

  const activeNote = state?.notes.find((note) => note.id === state.activeId);
  const visibleNotes = useMemo(
    () => filterAndSortNotes(state?.notes ?? [], searchTerm),
    [state?.notes, searchTerm]
  );

  function createNote() {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
      updatedAt: Date.now()
    };
    setSearchTerm("");
    updateState((current) => ({
      ...current,
      version: DATA_VERSION,
      notes: [note, ...current.notes],
      activeId: note.id
    }), true);
    requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".title-input")?.focus());
  }

  function selectNote(id: string) {
    updateState((current) => ({ ...current, activeId: id }), true);
  }

  function updateNote(updates: Pick<Note, "title" | "content">) {
    updateState((current) => ({
      ...current,
      notes: current.notes.map((note) => note.id === current.activeId
        ? { ...note, ...updates, updatedAt: Date.now() }
        : note)
    }));
  }

  function deleteNote() {
    if (!state || !activeNote) return;
    if (!window.confirm(`确定删除“${activeNote.title || "无标题笔记"}”吗？`)) return;
    updateState((current) => {
      const notes = current.notes.filter((note) => note.id !== current.activeId);
      const sorted = filterAndSortNotes(notes, "");
      return { ...current, notes, activeId: sorted[0]?.id ?? null };
    }, true);
  }

  function changeTheme(theme: Theme) {
    document.documentElement.dataset.theme = theme;
    void window.desktop.setTitleBarTheme(theme);
    updateState((current) => ({ ...current, theme }), true);
  }

  if (!state) {
    return <div className="loading">正在打开拾光笔记...</div>;
  }

  return (
    <div className="desktop-shell">
      <TitleBar />
      <main className="app">
        <Sidebar
          notes={visibleNotes}
          totalCount={state.notes.length}
          activeId={state.activeId}
          searchTerm={searchTerm}
          theme={state.theme}
          onSearch={setSearchTerm}
          onSelect={selectNote}
          onCreate={createNote}
          onThemeChange={changeTheme}
        />
        <Editor note={activeNote} saveStatus={saveStatus} onChange={updateNote} onDelete={deleteNote} />
      </main>
    </div>
  );
}
