import { PartyCellView } from "./PartyCellView";

import { Copyable } from "./Copyable";

import { formatDate } from "./format";

import { openDocument, saveComment } from "./bridge";

import { ModalPortal } from "./ModalPortal";

import { useFloatingMenu } from "./FloatingMenu";

import { useJsSpin } from "./useJsPulse";

import type { EpdListItem } from "./types";



type DocumentModalProps = {

  open: boolean;

  item: EpdListItem | null;

  loading: boolean;

  commentDraft: string;

  onCommentChange: (value: string) => void;

  onClose: () => void;

  onCopied: (value: string) => void;

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

}: DocumentModalProps) {

  const spinAngle = useJsSpin(loading);

  const { openAt: openFloatingMenu, portal: floatingMenuPortal } = useFloatingMenu();



  if (!item) {

    return null;

  }



  const handleSave = () => {

    saveComment(item.ref, item.docType, commentDraft);

  };



  return (

    <ModalPortal open={open} onClose={onClose} ariaLabelledBy="modal-title">

      <header className="modal-header">

        <div>

          <p className="modal-kicker">{item.docTypeName || item.docType}</p>

          <h2 id="modal-title">

            {item.number || item.ibNumber || "Без номера"}

            {item.date ? ` · ${formatDate(item.date)}` : ""}

          </h2>

        </div>

        <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">

          ×

        </button>

      </header>



      {loading ? (

        <div className="modal-loading">

          <div

            className="modal-loading-spinner modal-loading-spinner-css"

            aria-hidden="true"

            style={{ transform: `rotate(${spinAngle}deg)` }}

          />

          <p>Обновление деталей документа…</p>

        </div>

      ) : null}



      <div className="modal-actions-top">

        <button type="button" className="button-secondary" onClick={() => openDocument(item.ref, item.docType)}>

          Открыть в 1С

        </button>

      </div>



      <section className="modal-section">

        <h3>Идентификация</h3>

        <dl className="details-grid">

          <dt>Номер ЭПД</dt>

          <dd>

            <Copyable value={item.number} mono onCopied={onCopied} onOpenMenu={openFloatingMenu} />

          </dd>

          <dt>Номер в ИБ</dt>

          <dd>

            <Copyable value={item.ibNumber} mono onCopied={onCopied} onOpenMenu={openFloatingMenu} />

          </dd>

          <dt>Организация</dt>

          <dd>{item.organization || "—"}</dd>

          <dt>УИД Минтранс</dt>

          <dd>

            <Copyable value={item.uidMintrans ?? ""} mono onCopied={onCopied} onOpenMenu={openFloatingMenu} />

          </dd>

          <dt>Входящий</dt>

          <dd>{item.isIncoming === undefined ? "—" : item.isIncoming ? "Да" : "Нет"}</dd>

          <dt>Роль участника</dt>

          <dd>{item.roleParticipant || "—"}</dd>

        </dl>

        <div className="status-row">

          {item.deletionMark ? (

            <StatusBadge ok={false} label="На удалении" />

          ) : (

            <StatusBadge ok={true} label="Не удалён" />

          )}

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

            <PartyCellView

              party={item.shipper}

              organizationRef={item.organizationRef ?? ""}

              onCopied={onCopied}

              onOpenMenu={openFloatingMenu}

            />

          </div>

          <div>

            <p className="party-column-title">Перевозчик (П)</p>

            <PartyCellView

              party={item.carrier}

              organizationRef={item.organizationRef ?? ""}

              onCopied={onCopied}

              onOpenMenu={openFloatingMenu}

            />

          </div>

          <div>

            <p className="party-column-title">Грузополучатель (ГП)</p>

            <PartyCellView

              party={item.consignee}

              organizationRef={item.organizationRef ?? ""}

              onCopied={onCopied}

              onOpenMenu={openFloatingMenu}

            />

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

                <Copyable value={item.waybillNumber} mono onCopied={onCopied} onOpenMenu={openFloatingMenu} />

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

        {item.titleDates && item.titleDates.length > 0 ? (

          <>

            <h4 className="modal-subtitle">Даты титулов</h4>

            <dl className="details-grid">

              {item.titleDates.map((entry) => (

                <div className="details-grid-pair" key={entry.key}>

                  <dt>{entry.key}</dt>

                  <dd>{entry.value ? formatDate(entry.value) : "—"}</dd>

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



      {floatingMenuPortal}

    </ModalPortal>

  );

}

