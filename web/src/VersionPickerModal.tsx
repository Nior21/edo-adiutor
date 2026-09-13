import { ModalPortal } from "./ModalPortal";
import type { LocalReleaseInfo } from "./types";

type VersionPickerModalProps = {
  open: boolean;
  currentVersion: string;
  releases: LocalReleaseInfo[];
  onSelect: (version: string) => void;
  onClose: () => void;
};

export function VersionPickerModal({
  open,
  currentVersion,
  releases,
  onSelect,
  onClose,
}: VersionPickerModalProps) {
  const sorted = [...releases].sort((a, b) => {
    const pa = a.version.split(".").map((n) => parseInt(n, 10) || 0);
    const pb = b.version.split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) {
      const d = (pb[i] ?? 0) - (pa[i] ?? 0);
      if (d !== 0) {
        return d;
      }
    }
    return 0;
  });

  return (
    <ModalPortal open={open} onClose={onClose} cardClassName="version-picker-card" ariaLabelledBy="version-picker-title">
      <header className="modal-header">
        <div>
          <p className="modal-kicker">Версии на диске</p>
          <h2 id="version-picker-title">Переключить обработку</h2>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </header>
      <p className="muted version-picker-hint">
        Выбранная версия копируется в якорный <code>bin\…epf</code> (история остаётся в <code>releases</code>), затем
        откроется новое окно. Текущее v{currentVersion} можно закрыть.
      </p>
      {sorted.length === 0 ? (
        <p className="muted">Локальных релизов нет — укажите файл .epf и проверьте обновления.</p>
      ) : (
        <ul className="version-picker-list">
          {sorted.map((rel) => {
            const isCurrent = rel.version === currentVersion;
            return (
              <li key={rel.version}>
                <button
                  type="button"
                  className={`version-picker-item ${isCurrent ? "version-picker-item-current" : ""}`}
                  disabled={isCurrent}
                  onClick={() => onSelect(rel.version)}
                >
                  <span className="version-picker-ver">v{rel.version}</span>
                  {isCurrent ? <span className="muted">сейчас</span> : <span className="muted">открыть</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ModalPortal>
  );
}
