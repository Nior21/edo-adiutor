import { ModalPortal } from "./ModalPortal";

type UpdateOfferModalProps = {
  open: boolean;
  currentVersion: string;
  targetVersion: string;
  notes?: string;
  applying: boolean;
  onUpdate: () => void;
  onStay: () => void;
};

export function UpdateOfferModal({
  open,
  currentVersion,
  targetVersion,
  notes,
  applying,
  onUpdate,
  onStay,
}: UpdateOfferModalProps) {
  return (
    <ModalPortal
      open={open}
      onClose={onStay}
      cardClassName="update-offer-card"
      ariaLabelledBy="update-offer-title"
    >
      <header className="modal-header">
        <div>
          <p className="modal-kicker">Обновление обработки</p>
          <h2 id="update-offer-title">Доступна новая версия</h2>
        </div>
        <button type="button" className="modal-close" onClick={onStay} aria-label="Закрыть">
          ×
        </button>
      </header>
      <p className="update-offer-lead">
        Сейчас <strong>v{currentVersion}</strong>, на GitHub опубликован релиз <strong>v{targetVersion}</strong>.
        {notes ? ` ${notes}` : ""}
      </p>
      <p className="muted update-offer-hint">
        По возможности версия применится в этом же окне (без повторного «первого запуска» .epf). Если платформа
        потребует — откроется новое окно, старое можно закрыть. Реестр загрузим после обновления.
      </p>
      <div className="update-offer-actions">
        <button type="button" className="button-ghost update-btn-primary" disabled={applying} onClick={onUpdate}>
          {applying ? "Подготовка…" : `Обновить до v${targetVersion}`}
        </button>
        <button type="button" className="button-ghost" disabled={applying} onClick={onStay}>
          Остаться на текущей версии
        </button>
      </div>
    </ModalPortal>
  );
}
