type SupersededOverlayProps = {
  message: string;
  launchedVersion?: string;
};

export function SupersededOverlay({ message, launchedVersion }: SupersededOverlayProps) {
  return (
    <div className="superseded-overlay" role="alert">
      <div className="superseded-card">
        <p className="superseded-title">Это окно устарело</p>
        {launchedVersion ? <p className="superseded-version">Запущена v{launchedVersion}</p> : null}
        <p>{message}</p>
        <p className="muted superseded-hint">Закройте это окно обработки в 1С — работа продолжается в новом.</p>
      </div>
    </div>
  );
}
