import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { DATA_VERSION } from "../shared/defaults";
import type { AppState, DesktopApi } from "../shared/types";

const initialState: AppState = {
  version: DATA_VERSION,
  notes: [
    { id: "one", title: "第一篇", content: "苹果内容", updatedAt: 100 },
    { id: "two", title: "第二篇", content: "香蕉内容", updatedAt: 200 }
  ],
  activeId: "one",
  theme: "light"
};

let saveAppState: ReturnType<typeof vi.fn<(state: AppState) => Promise<void>>>;
let beforeClose: (() => void | Promise<void>) | undefined;

beforeEach(() => {
  saveAppState = vi.fn<(state: AppState) => Promise<void>>().mockResolvedValue(undefined);
  beforeClose = undefined;
  const desktop: DesktopApi = {
    loadAppState: vi.fn().mockResolvedValue(structuredClone(initialState)),
    saveAppState,
    setTitleBarTheme: vi.fn().mockResolvedValue(undefined),
    onBeforeClose: vi.fn((callback) => {
      beforeClose = callback;
      return vi.fn();
    }),
    confirmClose: vi.fn()
  };
  Object.defineProperty(window, "desktop", { configurable: true, value: desktop });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("App", () => {
  it("loads, searches and selects notes", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByDisplayValue("第一篇")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("搜索笔记..."), "香蕉");
    expect(screen.getByText("第二篇")).toBeInTheDocument();
    expect(screen.queryByText("第一篇")).not.toBeInTheDocument();

    await user.click(screen.getByText("第二篇"));
    expect(screen.getByDisplayValue("第二篇")).toBeInTheDocument();
  });

  it("creates, edits and automatically saves a note", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByDisplayValue("第一篇");

    await user.click(screen.getByRole("button", { name: "新建笔记" }));
    const title = screen.getByLabelText("笔记标题");
    await user.type(title, "桌面笔记");
    await user.type(screen.getByLabelText("笔记内容"), "离线保存");

    await waitFor(() => {
      const saved = saveAppState.mock.calls.at(-1)?.[0] as AppState | undefined;
      expect(saved?.notes.some((note) => note.title === "桌面笔记" && note.content === "离线保存")).toBe(true);
    }, { timeout: 1_500 });
    const saved = saveAppState.mock.calls.at(-1)?.[0] as AppState;
    expect(saved.notes.some((note) => note.title === "桌面笔记" && note.content === "离线保存")).toBe(true);
  });

  it("deletes the active note and shows empty state after the final deletion", async () => {
    const user = userEvent.setup();
    const oneNote = { ...initialState, notes: [initialState.notes[0]] };
    vi.mocked(window.desktop.loadAppState).mockResolvedValueOnce(oneNote);
    render(<App />);
    await screen.findByDisplayValue("第一篇");
    await user.click(screen.getByRole("button", { name: "删除笔记" }));
    expect(await screen.findByText("这里很安静")).toBeInTheDocument();
  });

  it("switches theme and flushes pending data before close", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByDisplayValue("第一篇");
    await user.click(screen.getByRole("button", { name: "深色" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(saveAppState).toHaveBeenCalled();

    await user.type(screen.getByLabelText("笔记内容"), "待关闭");
    await beforeClose?.();
    expect(window.desktop.confirmClose).toHaveBeenCalled();
  });

  it("switches between markdown edit and preview modes", async () => {
    const user = userEvent.setup();
    const markdownState: AppState = {
      ...initialState,
      notes: [{
        id: "markdown",
        title: "Markdown",
        content: "# 标题\n\n- **重点**\n\n访问 [官网](https://example.com)",
        updatedAt: 300
      }],
      activeId: "markdown"
    };
    vi.mocked(window.desktop.loadAppState).mockResolvedValueOnce(markdownState);

    render(<App />);
    expect(await screen.findByLabelText("笔记内容")).toHaveValue(markdownState.notes[0].content);

    await user.click(screen.getByRole("button", { name: "预览" }));
    expect(screen.getByRole("heading", { name: "标题" })).toBeInTheDocument();
    expect(screen.getByText("重点")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "官网" })).toHaveAttribute("href", "https://example.com");
    expect(screen.queryByLabelText("笔记内容")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "编辑" }));
    expect(screen.getByLabelText("笔记内容")).toHaveValue(markdownState.notes[0].content);
  });
});
