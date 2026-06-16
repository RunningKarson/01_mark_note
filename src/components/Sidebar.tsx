import type { Note, Theme } from "../../shared/types";
import { relativeDate } from "../../shared/domain";
import { ThemePicker } from "./ThemePicker";

interface SidebarProps {
  notes: Note[];
  totalCount: number;
  activeId: string | null;
  searchTerm: string;
  theme: Theme;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onThemeChange: (theme: Theme) => void;
}

export function Sidebar(props: SidebarProps) {
  const isSearching = props.searchTerm.trim().length > 0;
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <h1 className="brand"><span className="brand-mark">拾</span>拾光笔记</h1>
        <button className="new-note" type="button" title="新建笔记" aria-label="新建笔记" onClick={props.onCreate}>+</button>
      </div>

      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="搜索笔记..."
          value={props.searchTerm}
          onChange={(event) => props.onSearch(event.target.value)}
        />
      </label>

      <div className="list-label">
        <span>{isSearching ? "搜索结果" : "全部笔记"}</span>
        <span className="note-count">
          {isSearching ? `找到 ${props.notes.length} 篇` : `共 ${props.totalCount} 篇`}
        </span>
      </div>

      <div className="note-list" aria-label="笔记列表">
        {props.notes.map((note) => (
          <button
            className={`note-card${note.id === props.activeId ? " active" : ""}`}
            type="button"
            key={note.id}
            onClick={() => props.onSelect(note.id)}
          >
            <h3>{note.title || "无标题笔记"}</h3>
            <p className="note-preview">{note.content.replace(/\n/g, " ") || "暂无内容"}</p>
            <span className="note-time">{relativeDate(note.updatedAt)}</span>
          </button>
        ))}
        {isSearching && props.notes.length === 0 && <p className="no-results">没有找到相关笔记</p>}
      </div>

      <ThemePicker theme={props.theme} onChange={props.onThemeChange} />
    </aside>
  );
}
