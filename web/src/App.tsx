import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { notifyReady, requestDocument, requestList, saveComment } from "./bridge";
import { Copyable } from "./Copyable";
import type { EdoExchangeStatus, EtnDocument, EtnListItem, EtnParty, InitPayload } from "./types";

function parseJson<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ru-RU");
}

function formatInnKpp(inn: string, kpp: string): string {
  if (!inn && !kpp) {
    return "—";
  }
  if (inn && kpp) {
    return `${inn} / ${kpp}`;
  }
  return inn || kpp;
}

function EdoStatusIcon({ status }: { status: EdoExchangeStatus }) {
  if (status === "accepted") {
    return (
      <span className="edo-status edo-status-accepted" title="Обмен ЭДО: приглашение принято">
        ✓
      </span>
    );
  }
  if (status === "not_accepted") {
    return (
      <span className="edo-status edo-status-rejected" title="Обмен ЭДО: приглашение не принято">
        ✕
      </span>
    );
  }
  return <span className="edo-status edo-status-unknown" title="ID ЭДО не указан">?</span>;
}

function PartyCard({
  party,
  onCopied,
}: {
  party: EtnParty;
  onCopied: (value: string) => void;
}) {
  return (
    <article className="party-card">
      <header className="party-card-header">
        <span className="party-role">{party.roleLabel}</span>
        {party.participantName ? <span className="party-name">{party.participantName}</span> : null}
      </header>
      <div className="party-grid">
        <div className="party-field">
          <span className="party-label">ИНН / КПП</span>
          <Copyable
            value={formatInnKpp(party.inn, party.kpp) === "—" ? "" : formatInnKpp(party.inn, party.kpp)}
            mono
            onCopied={onCopied}
          />
        </div>
        <div className="party-field party-field-edo">
          <span className="party-label">ID ЭДО</span>
          <div className="party-edo-row">
            <EdoStatusIcon status={party.edoExchangeStatus} />
            <Copyable value={party.edoId} mono className="party-edo-id" onCopied={onCopied} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [version, setVersion] = useState("0.1.0");
  const [items, setItems] = useState<EtnListItem[]>([]);
  const [selectedRef, setSelectedRef] = useState<string>("");
  const [document, setDocument] = useState<EtnDocument | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [status, setStatus] = useState("Ожидание данных из 1С…");
  const [error, setError] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.ref === selectedRef) ?? null,
    [items, selectedRef],
  );

  const applyDocument = useCallback((payload: EtnDocument) => {
    setDocument(payload);
    setCommentDraft(payload.comment ?? "");
    setSelectedRef(payload.ref);
    setItems((prev) =>
      prev.map((item) => (item.ref === payload.ref ? { ...item, comment: payload.comment } : item)),
    );
  }, []);

  const handleCopied = useCallback((value: string) => {
    const preview = value.length > 48 ? `${value.slice(0, 48)}…` : value;
    setStatus(`Скопировано: ${preview}`);
    setError("");
  }, []);

  useEffect(() => {
    window.__edoBridgeRegister({
      init: (json: string) => {
        const payload = parseJson<InitPayload>(json, { version: "0.1.0", items: [] });
        setVersion(payload.version);
        setItems(payload.items ?? []);
        setStatus(`Загружено документов: ${payload.items?.length ?? 0}`);
        setError("");
        if ((payload.items?.length ?? 0) > 0 && !selectedRef) {
          const first = payload.items[0];
          setSelectedRef(first.ref);
          requestDocument(first.ref);
        }
      },
      setDocument: (json: string) => {
        const payload = parseJson<EtnDocument | null>(json, null);
        if (!payload) {
          setError("Не удалось разобрать документ");
          return;
        }
        applyDocument({ ...payload, parties: payload.parties ?? [] });
        setStatus("Документ загружен");
        setError("");
      },
      setStatus: (message: string) => {
        setStatus(message);
        setError("");
      },
      setError: (message: string) => {
        setError(message);
      },
    });

    notifyReady();

    return () => {
      window.__edoBridgeRegister(undefined);
    };
  }, [applyDocument, selectedRef]);

  const handleSelect = (ref: string) => {
    setSelectedRef(ref);
    setStatus("Загрузка документа…");
    requestDocument(ref);
  };

  const handleRefresh = () => {
    setStatus("Обновление списка…");
    requestList();
  };

  const handleSave = () => {
    if (!selectedRef) {
      setError("Не выбран документ");
      return;
    }
    setStatus("Сохранение комментария…");
    saveComment(selectedRef, commentDraft);
  };

  const stopRowClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const activeDoc = document ?? selectedItem;
  const parties = document?.parties ?? [];

  return (
    <div className="layout">
      <header className="header">
        <div>
          <h1>Электронные транспортные накладные</h1>
          <p className="muted">Помощник ЭДО · React UI v{version} · только ЭТрН</p>
        </div>
        <button type="button" onClick={handleRefresh}>
          Обновить список
        </button>
      </header>

      {(status || error) && (
        <div className={`banner ${error ? "banner-error" : "banner-info"}`}>{error || status}</div>
      )}

      <div className="content">
        <section className="panel">
          <h2>Список ({items.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Тип</th>
                  <th>Номер</th>
                  <th>Дата</th>
                  <th>УИД Минтранс</th>
                  <th>Организация</th>
                  <th>Титул</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.ref}
                    className={item.ref === selectedRef ? "row-active" : ""}
                    onClick={() => handleSelect(item.ref)}
                  >
                    <td onClick={stopRowClick}>
                      <Copyable value={item.docType || "ЭТрН"} onCopied={handleCopied} />
                    </td>
                    <td onClick={stopRowClick}>
                      <Copyable value={item.number} mono onCopied={handleCopied} />
                    </td>
                    <td onClick={stopRowClick}>
                      <Copyable value={item.date ? formatDate(item.date) : ""} onCopied={handleCopied} />
                    </td>
                    <td onClick={stopRowClick}>
                      <Copyable value={item.uidMintrans} mono onCopied={handleCopied} />
                    </td>
                    <td>{item.organization || "—"}</td>
                    <td>{item.currentTitle || "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted center">
                      Нет ЭТрН. Электронные заказы (ЭЗЗ) здесь не показываются.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel panel-details">
          <h2>Аудит документа</h2>
          {!activeDoc && <p className="muted">Выберите документ в списке.</p>}
          {activeDoc && (
            <>
              <div className="doc-summary">
                <Copyable
                  label="Тип"
                  value={activeDoc.docType || "ЭТрН"}
                  onCopied={handleCopied}
                />
                <Copyable
                  label="Номер"
                  value={activeDoc.number}
                  mono
                  onCopied={handleCopied}
                />
                <Copyable
                  label="Дата"
                  value={activeDoc.date ? formatDate(activeDoc.date) : ""}
                  onCopied={handleCopied}
                />
                <Copyable
                  label="УИД Минтранс"
                  value={activeDoc.uidMintrans}
                  mono
                  onCopied={handleCopied}
                />
                <Copyable
                  label="Номер ТН"
                  value={activeDoc.waybillNumber}
                  mono
                  onCopied={handleCopied}
                />
                <Copyable
                  label="Дата ТН"
                  value={activeDoc.waybillDate ? formatDate(activeDoc.waybillDate) : ""}
                  onCopied={handleCopied}
                />
              </div>

              {document && (
                <dl className="details details-compact">
                  <dt>Организация</dt>
                  <dd>{document.organization || "—"}</dd>
                  <dt>Текущий титул</dt>
                  <dd>{document.currentTitle || "—"}</dd>
                  <dt>Роль участника</dt>
                  <dd>{document.roleParticipant || "—"}</dd>
                  <dt>Текущий шаг</dt>
                  <dd>{document.currentStep || "—"}</dd>
                  <dt>Входящий</dt>
                  <dd>{document.isIncoming ? "Да" : "Нет"}</dd>
                </dl>
              )}

              <div className="parties-section">
                <div className="parties-header">
                  <h3>Стороны сделки</h3>
                  <p className="muted parties-hint">
                    ✓ обмен принят · ✕ не принят · ? ID не указан. Нажмите на значение, чтобы скопировать.
                  </p>
                </div>
                {parties.length === 0 ? (
                  <p className="muted">Стороны не заполнены в титуле.</p>
                ) : (
                  <div className="parties-list">
                    {parties.map((party) => (
                      <PartyCard key={party.role} party={party} onCopied={handleCopied} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <label className="comment-block">
            <span>Комментарий</span>
            <textarea
              rows={4}
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Введите комментарий к документу"
            />
          </label>
          <div className="actions">
            <button type="button" onClick={handleSave} disabled={!selectedRef}>
              Сохранить комментарий
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
