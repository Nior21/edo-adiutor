import { requestPickEpfPath } from "./bridge";
import type { UpdateInfoPayload } from "./types";

type UpdatePanelProps = {
  info: UpdateInfoPayload | null;
  applying: boolean;
  onRefreshCheck: () => void;
  onApply: (targetPath?: string) => void;
};

export function UpdatePanel({ info, applying, onRefreshCheck, onApply }: UpdatePanelProps) {
  if (!info || info.uiMode === "superseded" || info.phase === "superseded") {
    return null;
  }

  if (info.phase === "apply") {
    return (
      <div className={`update-banner ${info.success ? "update-banner-ok" : "update-banner-error"}`} role="status">
        <p>{info.message}</p>
      </div>
    );
  }

  const showPanel =
    info.manifestConfigured || Boolean(info.error) || !info.epfPath || info.updateAvailable || info.localReleases?.length;

  if (!showPanel) {
    return null;
  }

  const target = info.targetVersion || info.latestVersion;
  const hasLocal = info.localHasTarget;

  return (
    <div className="update-banner update-banner-info" role="status">
      {info.error ? <p className="update-banner-error-text">{info.error}</p> : null}
      {!info.epfPath ? (
        <p>
          Укажите файл <strong>.epf</strong> в каталоге <code>bin</code> — от него строится дерево{" "}
          <code>releases</code>.
        </p>
      ) : null}
      {info.updateAvailable ? (
        <p>
          Доступна версия <strong>v{target}</strong> (сейчас v{info.currentVersion}).
          {hasLocal
            ? " Релиз на диске — якорный .epf обновится, откроется новое окно."
            : " Скачаем с GitHub Releases, подменим якорный .epf и откроем новое окно."}
          {info.notes ? ` ${info.notes}` : ""}
        </p>
      ) : info.manifestConfigured && !info.error && info.epfPath ? (
        <p className="muted">Обновлений нет — v{info.currentVersion} актуальна для манифеста.</p>
      ) : null}
      <div className="update-banner-actions">
        {info.updateAvailable ? (
          <button
            type="button"
            className="button-ghost update-btn-primary"
            disabled={applying || !info.epfPath}
            onClick={() => onApply(info.epfPath)}
          >
            {applying ? "Подготовка…" : hasLocal ? "Открыть новую версию" : "Скачать и открыть"}
          </button>
        ) : null}
        <button type="button" className="button-ghost" onClick={requestPickEpfPath}>
          Выбрать файл…
        </button>
        <button type="button" className="button-ghost" onClick={onRefreshCheck}>
          Проверить снова
        </button>
      </div>
      {info.epfPath ? <p className="update-path muted">Якорь: {info.epfPath}</p> : null}
    </div>
  );
}
