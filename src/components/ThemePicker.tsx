import type { Theme } from "../../shared/types";

interface ThemePickerProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemePicker({ theme, onChange }: ThemePickerProps) {
  return (
    <div className="sidebar-footer">
      <div className="theme-heading">显示主题</div>
      <div className="theme-options" aria-label="显示主题">
        <button
          className={`theme-option${theme === "light" ? " active" : ""}`}
          type="button"
          aria-pressed={theme === "light"}
          onClick={() => onChange("light")}
        >
          <span aria-hidden="true">☀</span>
          浅色
        </button>
        <button
          className={`theme-option${theme === "dark" ? " active" : ""}`}
          type="button"
          aria-pressed={theme === "dark"}
          onClick={() => onChange("dark")}
        >
          <span aria-hidden="true">☾</span>
          深色
        </button>
      </div>
    </div>
  );
}
