import { ModalPortal } from "./ModalPortal";
import type { VersionCatalogItem } from "./types";

type VersionPickerModalProps = {
  open: boolean;
  currentVersion: string;
  catalog: VersionCatalogItem[];
  checking: boolean;
  onSelect: (item: VersionCatalogItem) => void;
  onRefresh: () => void;
  onClose: () => void;
};

function sortCatalog(items: VersionCatalogItem[]): VersionCatalogItem[] {
  return [...items].sort((a, b) => {
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
}

function itemLabel(item: VersionCatalogItem): string {
  if (item.kind === "remote" && !item.installed) {
    return "скачать с GitHub";
  }
  if (item.kind === "current") {
    return "сейчас";
  }
  return "открыть";
}

export function VersionPickerModal({
  open,
  currentVersion,
  catalog,
  checking,
  onSelect,
  onRefresh,
  onClose,
}: VersionPickerModalProps) {
  const sorted = sortCatalog(catalog);

  return (
    <ModalPortal open={open} onClose={onClose} cardClassName="version-picker-card" ariaLabelledBy="version-picker-title">
      <header className="modal-header">
        <div>
          <p className="modal-kicker">Версии обработки</p>
          <h2 id="version-picker-title">Установленные и доступные</h2>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </header>
      <p className="muted version-picker-hint">
        Текущая сессия: v{currentVersion}. Локальные копии — в <code>releases</code> рядом с файлом .epf; якорный файл
        обновляется при переключении.
      </p>
      <div className="version-picker-toolbar">
        <button type="button" className="button-ghost" disabled={checking} onClick={onRefresh}>
          {checking ? "Проверка…" : "Проверить обновления"}
        </button>
      </div>
      {sorted.length === 0 ? (
        <p className="muted">Пока только текущая версия — нажмите «Проверить обновления».</p>
      ) : (
        <ul className="version-picker-list">
          {sorted.map((item) => {
            const isCurrent = item.version === currentVersion && item.kind !== "remote";
            const remotePending = item.kind === "remote" && !item.installed;
            const disabled = isCurrent && !remotePending;
            return (
              <li key={`${item.version}-${item.kind}`}>
                <button
                  type="button"
                  className={`version-picker-item ${isCurrent ? "version-picker-item-current" : ""} ${remotePending ? "version-picker-item-remote" : ""}`}
                  disabled={disabled}
                  onClick={() => onSelect(item)}
                >
                  <span className="version-picker-ver">v{item.version}</span>
                  <span className="version-picker-action">{itemLabel(item)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ModalPortal>
  );
}
