import { isLoadActive, loadProgressLabel, loadProgressPercent } from "./loadProgressUi";
import type { ListLoadProgress } from "./listLoader";
import type { Toast } from "./useToast";

type StatusBarProps = {
  toast: Toast | null;
  hint: string;
  version: string;
  loadProgress: ListLoadProgress | null;
  onAboutOpen: () => void;
};

export function StatusBar({ toast, hint, version, loadProgress, onAboutOpen }: StatusBarProps) {
  const isError = toast?.kind === "error";
  const loading = isLoadActive(loadProgress);
  const percent = loadProgress ? loadProgressPercent(loadProgress) : 0;
  const loadLabel = loadProgress ? loadProgressLabel(loadProgress) : "";

  return (
    <footer
      className={`status-bar ${loading ? "status-bar-loading" : toast ? "status-bar-active" : "status-bar-hint"}`}
      role="status"
    >
      <div className="status-bar-body">
        {loading ? (
          <>
            <span className="status-bar-message status-bar-load-text">{loadLabel}</span>
            <div className="status-load-track" aria-hidden="true">
              <div className="status-load-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
            </div>
          </>
        ) : toast ? (
          <span className={`status-bar-message ${isError ? "status-bar-error" : "status-bar-info"}`}>
            {toast.message}
          </span>
        ) : (
          <span className="status-bar-message status-bar-hint-text">{hint}</span>
        )}
      </div>

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
