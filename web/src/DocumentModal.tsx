import { PartyCellView } from "./PartyCellView";

import { Copyable } from "./Copyable";

import { formatDate } from "./format";

import { openDocument, saveComment } from "./bridge";

import { ModalPortal } from "./ModalPortal";

import { useFloatingMenu } from "./FloatingMenu";


import type { DetailField, EpdListItem } from "./types";
import { fetchDocumentXml } from "./bridgeAsync";
import { downloadBase64File } from "./downloadBase64";



type DocumentModalProps = {

  open: boolean;

  item: EpdListItem | null;


  commentDraft: string;

  onCommentChange: (value: string) => void;

  onClose: () => void;

  onCopied: (value: string) => void;

};




function detailGroupOrder(group: string): number {
  if (group.startsWith("Содержимое:")) {
    return 0;
  }
  if (group === "Реквизиты титулов") {
    return 1;
  }
  if (group === "ЭТрН" || group.startsWith("Груз")) {
    return 2;
  }
  return 10;
}

function sortDetailGroups(entries: [string, DetailField[]][]): [string, DetailField[]][] {
  return [...entries].sort((a, b) => {
    const diff = detailGroupOrder(a[0]) - detailGroupOrder(b[0]);
    return diff !== 0 ? diff : a[0].localeCompare(b[0], "ru");
  });
}

function formatByteSize(size?: number): string {
  if (!size || size <= 0) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {

  return <span className={`status-badge ${ok ? "status-badge-ok" : "status-badge-warn"}`}>{label}</span>;

}



export function DocumentModal({

  open,

  item,


  commentDraft,

  onCommentChange,

  onClose,

  onCopied,

}: DocumentModalProps) {


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



      

      
      {item.xmlFiles && item.xmlFiles.length > 0 ? (
        <section className="modal-section">
          <h3>XML электронного документа</h3>
          <ul className="xml-download-list">
            {item.xmlFiles.map((file) => (
              <li key={file.fileRef} className="xml-download-item">
                <div>
                  <div className="xml-download-label">{file.label}</div>
                  <div className="xml-download-meta">
                    {file.fileName}
                    {formatByteSize(file.byteSize) ? ` · ${formatByteSize(file.byteSize)}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    void (async () => {
                      try {
                        const payload = await fetchDocumentXml(item.ref, item.docType, file.fileRef);
                        if (!payload.success || !payload.dataBase64) {
                          onCopied(payload.error || "Не удалось получить XML");
                          return;
                        }
                        downloadBase64File(payload.dataBase64, payload.fileName || file.fileName);
                        onCopied(`Скачан ${payload.fileName || file.fileName}`);
                      } catch (error) {
                        onCopied(error instanceof Error ? error.message : "Ошибка загрузки XML");
                      }
                    })();
                  }}
                >
                  Скачать XML
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

{item.detailFields && item.detailFields.length > 0 ? (
        <section className="modal-section">
          <h3>Данные документа</h3>
          {sortDetailGroups(
            Array.from(
              item.detailFields.reduce((groups, field) => {
                const list = groups.get(field.group) ?? [];
                list.push(field);
                groups.set(field.group, list);
                return groups;
              }, new Map<string, DetailField[]>()),
            ),
          ).map(([group, fields]) => (
            <div key={group} className="modal-detail-group">
              <h4 className="modal-subtitle">{group}</h4>
              <dl className="details-grid">
                {fields.map((field) => (
                  <div className="details-grid-pair" key={`${group}-${field.label}-${field.value}`}>
                    <dt>{field.label}</dt>
                    <dd>
                      <Copyable value={field.value} mono onCopied={onCopied} onOpenMenu={openFloatingMenu} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </section>
      ) : null}

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

            placeholder="Номер заявки оператору, статус… Служебный тег ошибки: [!] в начале строки"

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


