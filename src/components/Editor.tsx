import type { Note } from "../../shared/types";
import { countCharacters, formatDate } from "../../shared/domain";

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

export function Editor({ note, saveStatus, onChange, onDelete }: EditorProps) {
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
          <button className="delete-note" type="button" onClick={onDelete}>删除笔记</button>
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
        <textarea
          className="content-input"
          aria-label="笔记内容"
          placeholder="从这里开始记录你的想法..."
          value={note.content}
          onChange={(event) => onChange({ title: note.title, content: event.target.value })}
        />
      </div>
    </section>
  );
}
