import { createPortal } from "react-dom";
import { PartyCellView } from "./PartyCellView";
import { Copyable } from "./Copyable";
import { formatDate } from "./format";
import { openDocument, saveComment } from "./bridge";
import type { EpdListItem } from "./types";

type DocumentModalProps = {
  open: boolean;
  item: EpdListItem | null;
  loading: boolean;
  commentDraft: string;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onCopied: (value: string) => void;
  onSaved: (ref: string, comment: string) => void;
};

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return <span className={`status-badge ${ok ? "status-badge-ok" : "status-badge-warn"}`}>{label}</span>;
}

export function DocumentModal({
  open,
  item,
  loading,
  commentDraft,
  onCommentChange,
  onClose,
  onCopied,
  onSaved,
}: DocumentModalProps) {
  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleSave = () => {
    if (!item) {
      return;
    }
    saveComment(item.ref, commentDraft);
    onSaved(item.ref, commentDraft);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <p className="modal-kicker">{item?.docTypeName || item?.docType || "Документ ЭПД"}</p>
            <h2 id="modal-title">
              {item?.number || item?.ibNumber || "Загрузка…"}
              {item?.date ? ` · ${formatDate(item.date)}` : ""}
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        {loading && !item ? (
          <div className="modal-loading">
            <div className="modal-loading-spinner" aria-hidden="true" />
            <p>Загрузка деталей документа…</p>
          </div>
        ) : null}

        {item ? (
          <>
            <div className="modal-actions-top">
              <button type="button" className="button-secondary" onClick={() => openDocument(item.ref)}>
                Открыть в 1С
              </button>
            </div>

            <section className="modal-section">
              <h3>Идентификация</h3>
              <dl className="details-grid">
                <dt>Номер ЭПД</dt>
                <dd>
                  <Copyable value={item.number} mono onCopied={onCopied} />
                </dd>
                <dt>Номер в ИБ</dt>
                <dd>
                  <Copyable value={item.ibNumber} mono onCopied={onCopied} />
                </dd>
                <dt>Организация</dt>
                <dd>{item.organization || "—"}</dd>
                <dt>УИД Минтранс</dt>
                <dd>
                  <Copyable value={item.uidMintrans ?? ""} mono onCopied={onCopied} />
                </dd>
                <dt>Входящий</dt>
                <dd>{item.isIncoming === undefined ? "—" : item.isIncoming ? "Да" : "Нет"}</dd>
                <dt>Роль участника</dt>
                <dd>{item.roleParticipant || "—"}</dd>
              </dl>
              <div className="status-row">
                <StatusBadge ok={item.posted} label={item.posted ? "Проведён" : "Не проведён"} />
                <StatusBadge ok={!item.deletionMark} label={item.deletionMark ? "На удалении" : "Активен"} />
                <StatusBadge
                  ok={item.currentStepDone}
                  label={item.currentStepDone ? "Шаг выполнен" : "Шаг не выполнен"}
                />
              </div>
            </section>

            <section className="modal-section">
              <h3>Стороны</h3>
              <div className="modal-parties">
                <div>
                  <p className="party-column-title">Грузоотправитель (ГО)</p>
                  <PartyCellView party={item.shipper} onCopied={onCopied} />
                </div>
                <div>
                  <p className="party-column-title">Грузополучатель (ГП)</p>
                  <PartyCellView party={item.consignee} onCopied={onCopied} />
                </div>
                <div>
                  <p className="party-column-title">Перевозчик (П)</p>
                  <PartyCellView party={item.carrier} onCopied={onCopied} />
                </div>
              </div>
            </section>

            <section className="modal-section">
              <h3>Состояние</h3>
              <dl className="details-grid">
                <dt>Текущий шаг</dt>
                <dd>{item.currentStep || "—"}</dd>
                {item.waybillNumber ? (
                  <>
                    <dt>Номер ТН</dt>
                    <dd>
                      <Copyable value={item.waybillNumber} mono onCopied={onCopied} />
                    </dd>
                  </>
                ) : null}
                {item.waybillDate ? (
                  <>
                    <dt>Дата ТН</dt>
                    <dd>{formatDate(item.waybillDate)}</dd>
                  </>
                ) : null}
              </dl>
              {item.titleDates && Object.keys(item.titleDates).length > 0 ? (
                <>
                  <h4 className="modal-subtitle">Даты титулов</h4>
                  <dl className="details-grid">
                    {Object.entries(item.titleDates).map(([key, value]) => (
                      <div className="details-grid-pair" key={key}>
                        <dt>{key}</dt>
                        <dd>{value ? formatDate(value) : "—"}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : null}
            </section>

            {item.diagnostics && item.diagnostics.length > 0 ? (
              <section className="modal-section modal-diagnostics">
                <h3>Замечания для разбора</h3>
                <ul>
                  {item.diagnostics.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="modal-section">
              <label className="comment-block">
                <span>Комментарий</span>
                <textarea
                  rows={3}
                  value={commentDraft}
                  onChange={(event) => onCommentChange(event.target.value)}
                  placeholder="Комментарий к документу"
                />
              </label>
              <div className="actions">
                <button type="button" onClick={handleSave}>
                  Сохранить комментарий
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
