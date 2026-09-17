import { ModalPortal } from "./ModalPortal";
import type { DetailField } from "./types";

type ComplexFieldEditorStubProps = {
  open: boolean;
  field: DetailField;
  onClose: () => void;
};

/** Заготовка редактора ссылочных/сложных реквизитов ЭПД — доработка отдельным этапом. */
export function ComplexFieldEditorStub({ open, field, onClose }: ComplexFieldEditorStubProps) {
  if (!open) {
    return null;
  }

  const kind = field.valueKind ?? "complex";

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose} role="presentation">
        <div
          className="modal-card modal-card-narrow"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-header">
            <div>
              <p className="modal-kicker">{field.group}</p>
              <h2>{field.label}</h2>
            </div>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
              ×
            </button>
          </div>
          <p className="complex-field-stub-text">
            Редактирование реквизитов типа «{kind}» (списки, ссылки, конструкторы) — в разработке. Для этого поля
            пока доступны только просмотр и копирование.
          </p>
          <p className="complex-field-stub-meta">
            Идентификатор поля: <code>{field.fieldId ?? "—"}</code>
          </p>
          <div className="actions">
            <button type="button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
