import { isLoadActive, loadProgressLabel, loadProgressPercent } from "./loadProgressUi";
import type { ListLoadProgress } from "./listLoader";
import type { Toast } from "./useToast";

type StatusBarProps = {
  toast: Toast | null;
  hint: string;
  uiVersion: string;
  moduleVersion?: string;
  versionMismatch?: boolean;
  loadProgress: ListLoadProgress | null;
  updateChecking: boolean;
  updateAvailable: boolean;
  updateTargetVersion?: string;
  updateError?: string;
  onAboutOpen: () => void;
  onVersionClick?: () => void;
};

export function StatusBar({
  toast,
  hint,
  uiVersion,
  moduleVersion,
  versionMismatch,
  loadProgress,
  updateChecking,
  updateAvailable,
  updateTargetVersion,
  updateError,
  onAboutOpen,
  onVersionClick,
}: StatusBarProps) {
  const isError = toast?.kind === "error";
  const loading = isLoadActive(loadProgress);
  const percent = loadProgress ? loadProgressPercent(loadProgress) : 0;
  const loadLabel = loadProgress ? loadProgressLabel(loadProgress) : "";

  let message = hint;
  let messageClass = "status-bar-hint-text";
  if (updateChecking) {
    message = "Проверка обновлений…";
    messageClass = "status-bar-info";
  } else if (loading) {
    message = loadLabel;
    messageClass = "status-bar-load-text";
  } else if (toast) {
    message = toast.message;
    messageClass = isError ? "status-bar-error" : "status-bar-info";
  } else if (versionMismatch && moduleVersion) {
    const uiNewer =
      moduleVersion.localeCompare(uiVersion, undefined, { numeric: true }) < 0;
    message = uiNewer
      ? `Интерфейс v${uiVersion}, модуль EPF v${moduleVersion} — пересборка pack.ps1 / F7 (для разработки)`
      : `Интерфейс v${uiVersion}, в EPF модуль v${moduleVersion} — нажмите «Обновить» или откройте .epf из bin/releases`;
    messageClass = "status-bar-error";
  } else if (updateAvailable && updateTargetVersion) {
    message = `Доступна версия v${updateTargetVersion} — нажмите на бейдж справа для обновления`;
    messageClass = "status-bar-info";
  } else if (updateError) {
    message = updateError;
    messageClass = "status-bar-error";
  }

  const badgeTitle = updateAvailable
    ? `Доступен новый релиз v${updateTargetVersion ?? "?"}. Нажмите для проверки и установки.`
    : versionMismatch && moduleVersion
      ? `Интерфейс v${uiVersion}, в файле EPF заявлено v${moduleVersion}. Обновите или пересоберите EPF (F7).`
      : updateChecking
        ? "Проверяем обновления…"
        : `Интерфейс v${uiVersion}${moduleVersion && moduleVersion !== uiVersion ? ` · EPF v${moduleVersion}` : ""}. Нажмите для списка версий.`;

  const badgeLabel = updateAvailable ? (
    <>
      <span className="status-version-shake" aria-hidden="true">
        🔄
      </span>{" "}
      UI v{uiVersion}
    </>
  ) : (
    <>UI v{uiVersion}</>
  );

  const badgeClass = [
    "status-version-badge",
    onVersionClick ? "status-version-btn" : "",
    updateAvailable ? "status-version-badge-update" : "",
    versionMismatch ? "status-version-badge-mismatch" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer
      className={`status-bar ${loading || updateChecking ? "status-bar-loading" : toast ? "status-bar-active" : "status-bar-hint"}`}
      role="status"
    >
      <div className="status-bar-body">
        {loading && !updateChecking ? (
          <>
            <span className={`status-bar-message ${messageClass}`}>{message}</span>
            <div className="status-load-track" aria-hidden="true">
              <div className="status-load-fill" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
            </div>
          </>
        ) : (
          <span className={`status-bar-message ${messageClass}`}>{message}</span>
        )}
      </div>

      <div className="status-bar-tools">
        {onVersionClick ? (
          <button type="button" className={badgeClass} title={badgeTitle} onClick={onVersionClick}>
            {badgeLabel}
          </button>
        ) : (
          <span className={badgeClass} title={badgeTitle}>
            {badgeLabel}
          </span>
        )}
        <button
          type="button"
          className="status-help-btn"
          onClick={onAboutOpen}
          title="О программе и авторе"
          aria-label="О программе"
        >
          ?
        </button>
      </div>
    </footer>
  );
}
