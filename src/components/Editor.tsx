import { useRef, useState } from "react";
import type { Note } from "../../shared/types";
import { countCharacters, formatDate } from "../../shared/domain";
import { MarkdownHighlight, MarkdownPreview } from "./MarkdownView";

export type SaveStatus = "saved" | "saving" | "error";

interface EditorProps {
  note?: Note;
  saveStatus: SaveStatus;
  onChange: (updates: Pick<Note, "title" | "content">) => void;
  onDelete: () => void;
}

const statusText: Record<SaveStatus, string> = {
  saved: "已自动保存",
  saving: "正在保存...",
  error: "保存失败，请继续编辑后重试"
};

type EditorMode = "edit" | "preview";

export function Editor({ note, saveStatus, onChange, onDelete }: EditorProps) {
  const [mode, setMode] = useState<EditorMode>("edit");
  const highlightRef = useRef<HTMLPreElement>(null);

  if (!note) {
    return (
      <section className="editor">
        <div className="empty-state">
          <div><strong>这里很安静</strong>新建一篇笔记，记录此刻的想法。</div>
        </div>
      </section>
    );
  }

  return (
    <section className="editor">
      <div className="editor-area">
        <div className="editor-toolbar">
          <span className={`save-status ${saveStatus}`}>
            <span className="save-dot" />
            <span>{statusText[saveStatus]}</span>
          </span>
          <div className="editor-toolbar-actions">
            <div className="mode-switch" aria-label="编辑器模式">
              <button
                className={mode === "edit" ? "active" : ""}
                type="button"
                aria-pressed={mode === "edit"}
                onClick={() => setMode("edit")}
              >
                编辑
              </button>
              <button
                className={mode === "preview" ? "active" : ""}
                type="button"
                aria-pressed={mode === "preview"}
                onClick={() => setMode("preview")}
              >
                预览
              </button>
            </div>
            <button className="delete-note" type="button" onClick={onDelete}>删除笔记</button>
          </div>
        </div>
        <input
          className="title-input"
          aria-label="笔记标题"
          type="text"
          placeholder="笔记标题"
          value={note.title}
          onChange={(event) => onChange({ title: event.target.value, content: note.content })}
        />
        <div className="meta">
          <span>最后编辑于 {formatDate(note.updatedAt)}</span>
          <span>{countCharacters(note.content)} 字</span>
        </div>
        {mode === "edit" ? (
          <div className="markdown-editor-wrap">
            <pre className="markdown-highlight-layer" aria-hidden="true" ref={highlightRef}>
              <MarkdownHighlight content={note.content || " "} />
            </pre>
            <textarea
              className="content-input markdown-textarea"
              aria-label="笔记内容"
              placeholder="从这里开始记录你的想法..."
              value={note.content}
              onScroll={(event) => {
                if (highlightRef.current) {
                  highlightRef.current.scrollTop = event.currentTarget.scrollTop;
                  highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
                }
              }}
              onChange={(event) => onChange({ title: note.title, content: event.target.value })}
            />
          </div>
        ) : (
          <MarkdownPreview content={note.content} />
        )}
      </div>
    </section>
  );
}
