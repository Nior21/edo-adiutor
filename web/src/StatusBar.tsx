import type { Toast } from "./useToast";

type StatusBarProps = {
  toast: Toast | null;
  hint: string;
  version: string;
  onAboutOpen: () => void;
};

export function StatusBar({ toast, hint, version, onAboutOpen }: StatusBarProps) {
  const isError = toast?.kind === "error";

  return (
    <footer className={`status-bar ${toast ? "status-bar-active" : "status-bar-hint"}`} role="status">
      {toast ? (
        <span className={`status-bar-message ${isError ? "status-bar-error" : "status-bar-info"}`}>
          {toast.message}
        </span>
      ) : (
        <span className="status-bar-message status-bar-hint-text">{hint}</span>
      )}

      <div className="status-bar-tools">
        <button
          type="button"
          className="status-help-btn"
          onClick={onAboutOpen}
          title="О программе и авторе"
          aria-label="О программе"
        >
          ?
        </button>
        <span className="status-version-badge" title={`Версия ${version}`}>
          v{version}
        </span>
      </div>
    </footer>
  );
}
