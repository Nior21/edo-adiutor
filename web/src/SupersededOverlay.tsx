type SupersededOverlayProps = {
  message: string;
  launchedVersion?: string;
  launchedPath?: string;
  onOpenLaunch?: () => void;
  onPickFile?: () => void;
};

export function SupersededOverlay({
  message,
  launchedVersion,
  onOpenLaunch,
  onPickFile,
}: SupersededOverlayProps) {
  return (
    <div className="superseded-overlay" role="alert">
      <div className="superseded-card">
        <p className="superseded-title">Это окно устарело</p>
        {launchedVersion ? <p className="superseded-version">Запущена v{launchedVersion}</p> : null}
        <p>{message}</p>
        <p className="muted superseded-hint">
          Работайте в новом окне обработки. Если оно не появилось — нажмите кнопку ниже или перетащите .epf на окно
          1С (как при первом открытии).
        </p>
        <div className="superseded-actions">
          {onOpenLaunch ? (
            <button type="button" className="button-ghost update-btn-primary" onClick={onOpenLaunch}>
              Открыть новую версию
            </button>
          ) : null}
          {onPickFile ? (
            <button type="button" className="button-ghost" onClick={onPickFile}>
              Выбрать файл .epf…
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
