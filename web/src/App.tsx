import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { notifyReady, requestDocument, requestList } from "./bridge";
import { Copyable } from "./Copyable";
import { DocumentModal } from "./DocumentModal";
import { PartyCellView } from "./PartyCellView";
import { StatusBar } from "./StatusBar";
import { TableSkeleton } from "./TableSkeleton";
import { formatDate } from "./format";
import { useToast } from "./useToast";
import type { EpdListItem, InitPayload } from "./types";

const TABLE_HINT =
  "Клик по строке — карточка документа. Клик по значению — копирование. М — наша организация, ✓/✕/? — обмен ЭДО с контрагентом.";

function parseJson<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [version, setVersion] = useState("0.3.0");
  const [items, setItems] = useState<EpdListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [modalRef, setModalRef] = useState<string>("");
  const [modalDoc, setModalDoc] = useState<EpdListItem | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const { toast, showToast } = useToast();

  const modalItem = useMemo(() => {
    if (modalDoc?.ref === modalRef) {
      return modalDoc;
    }
    return items.find((item) => item.ref === modalRef) ?? null;
  }, [items, modalDoc, modalRef]);

  const handleCopied = useCallback(
    (value: string) => {
      const preview = value.length > 48 ? `${value.slice(0, 48)}…` : value;
      showToast(`Скопировано: ${preview}`);
    },
    [showToast],
  );

  const mergeItem = useCallback((payload: EpdListItem) => {
    setItems((prev) => prev.map((item) => (item.ref === payload.ref ? { ...item, ...payload } : item)));
    setModalDoc(payload);
    setCommentDraft(payload.comment ?? "");
    setDocLoading(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(modalRef));
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [modalRef]);

  useEffect(() => {
    window.__edoBridgeRegister({
      init: (json: string) => {
        const payload = parseJson<InitPayload>(json, { version: "0.3.0", items: [] });
        setVersion(payload.version);
        setItems(payload.items ?? []);
        setListLoading(false);
        showToast(`Загружено документов: ${payload.items?.length ?? 0}`);
      },
      setDocument: (json: string) => {
        const payload = parseJson<EpdListItem | null>(json, null);
        if (!payload) {
          showToast("Не удалось разобрать документ", "error");
          setDocLoading(false);
          return;
        }
        mergeItem(payload);
      },
      setStatus: (message: string) => {
        showToast(message);
      },
      setError: (message: string) => {
        showToast(message, "error");
      },
    });

    notifyReady();

    return () => {
      window.__edoBridgeRegister(undefined);
    };
  }, [mergeItem, showToast]);

  const openModal = (ref: string) => {
    const row = items.find((item) => item.ref === ref);
    setModalRef(ref);
    setModalDoc(row ?? null);
    setCommentDraft(row?.comment ?? "");
    setDocLoading(true);
    requestDocument(ref);
  };

  const closeModal = () => {
    setModalRef("");
    setModalDoc(null);
    setDocLoading(false);
  };

  const handleRefresh = () => {
    setListLoading(true);
    closeModal();
    showToast("Обновление списка…");
    requestList();
  };

  const stopRowClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const handleSaved = (ref: string, comment: string) => {
    setItems((prev) => prev.map((item) => (item.ref === ref ? { ...item, comment } : item)));
    setModalDoc((prev) => (prev?.ref === ref ? { ...prev, comment } : prev));
    showToast("Комментарий сохранён");
  };

  return (
    <div className="layout layout-full layout-shell">
      <div className="layout-toolbar">
        <span className="app-meta muted">
          Помощник ЭДО · v{version} · ЭТрН, ЭСВ, ЭЗЗ, ЭЗН, ЭПЛ, ЭДФ
        </span>
        <button type="button" className="button-ghost" onClick={handleRefresh} title="Обновить список">
          ↻ Обновить
        </button>
      </div>

      <section className="panel panel-table panel-flex">
        <div className="table-wrap table-wrap-wide">
          {listLoading ? (
            <TableSkeleton />
          ) : (
            <table className="epd-table">
              <thead>
                <tr>
                  <th>Документ</th>
                  <th>Грузоотправитель</th>
                  <th>Грузополучатель</th>
                  <th>Перевозчик</th>
                  <th>Шаг</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.ref}
                    className={`${item.deletionMark ? "row-deleted" : ""} ${item.ref === modalRef ? "row-active" : ""}`}
                    onClick={() => openModal(item.ref)}
                  >
                    <td onClick={stopRowClick}>
                      <div className="cell-stack doc-cell">
                        <span className="doc-type-badge" title={item.docTypeName}>
                          {item.docType}
                        </span>
                        <Copyable value={item.number} mono className="doc-number-btn" onCopied={handleCopied} />
                        <span className="cell-muted">{item.date ? formatDate(item.date) : "—"}</span>
                      </div>
                    </td>
                    <td onClick={stopRowClick}>
                      <PartyCellView party={item.shipper} onCopied={handleCopied} />
                    </td>
                    <td onClick={stopRowClick}>
                      <PartyCellView party={item.consignee} onCopied={handleCopied} />
                    </td>
                    <td onClick={stopRowClick}>
                      <PartyCellView party={item.carrier} onCopied={handleCopied} />
                    </td>
                    <td>
                      <div className="cell-stack">
                        <span>{item.currentStep || "—"}</span>
                        <span className={`step-flag ${item.currentStepDone ? "step-done" : "step-pending"}`}>
                          {item.currentStepDone ? "выполнен" : "не выполнен"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="status-chips">
                        <span className={`chip ${item.posted ? "chip-ok" : "chip-neutral"}`}>
                          {item.posted ? "Пров." : "Черн."}
                        </span>
                        {item.deletionMark ? <span className="chip chip-danger">Удал.</span> : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted center">
                      В реестре ЭПД нет документов.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <StatusBar toast={toast} hint={TABLE_HINT} />

      <DocumentModal
        open={Boolean(modalRef)}
        item={modalItem}
        loading={docLoading}
        commentDraft={commentDraft}
        onCommentChange={setCommentDraft}
        onClose={closeModal}
        onCopied={handleCopied}
        onSaved={handleSaved}
      />
    </div>
  );
}
