import { requestPickEpfPath } from "./bridge";
import type { UpdateInfoPayload } from "./types";

type UpdatePanelProps = {
  info: UpdateInfoPayload | null;
  applying: boolean;
  onRefreshCheck: () => void;
  onApply: (targetPath?: string) => void;
};

export function UpdatePanel({ info, applying, onRefreshCheck, onApply }: UpdatePanelProps) {
  if (!info) {
    return null;
  }

  if (info.phase === "apply") {
    return (
      <div className={`update-banner ${info.success ? "update-banner-ok" : "update-banner-error"}`} role="status">
        <p>{info.message}</p>
      </div>
    );
  }

  if (!info.manifestConfigured && !info.error) {
    return null;
  }

  return (
    <div className="update-banner update-banner-info" role="status">
      {info.error ? <p className="update-banner-error-text">{info.error}</p> : null}
      {info.updateAvailable ? (
        <p>
          Доступна версия <strong>v{info.latestVersion}</strong> (сейчас v{info.currentVersion}).
          {info.notes ? ` ${info.notes}` : ""}
        </p>
      ) : info.manifestConfigured && !info.error ? (
        <p className="muted">Обновлений нет — установлена актуальная версия v{info.currentVersion}.</p>
      ) : null}
      <div className="update-banner-actions">
        {info.updateAvailable ? (
          <button
            type="button"
            className="button-ghost update-btn-primary"
            disabled={applying}
            onClick={() => onApply(info.epfPath)}
          >
            {applying ? "Загрузка…" : "Обновить файл .epf"}
          </button>
        ) : null}
        <button type="button" className="button-ghost" onClick={requestPickEpfPath}>
          Выбрать файл…
        </button>
        <button type="button" className="button-ghost" onClick={onRefreshCheck}>
          Проверить снова
        </button>
      </div>
      {info.epfPath ? <p className="update-path muted">Файл: {info.epfPath}</p> : null}
    </div>
  );
}
