import { useEffect } from "react";
import { openEdoSettings, openEdoTransportSettings } from "./bridge";
import { ExternalLinkIcon } from "./ExternalLinkIcon";
import { Copyable } from "./Copyable";
import { resolveOperatorDisplay } from "./edoOperator";
import { formatInn } from "./format";
import { ModalPortal } from "./ModalPortal";
import type { EdoDiagnosticsLoadPhase } from "./edoDiagnosticsLoader";
import type { EdoDiagnosticInvitation, EdoDiagnosticItem, EdoDiagnosticsPayload } from "./types";

type EdoDiagnosticsModalProps = {
  open: boolean;
  loadingPhase: EdoDiagnosticsLoadPhase;
  error: string;
  onlineError: string;
  data: EdoDiagnosticsPayload | null;
  organizationRef: string;
  entityRef: string;
  onClose: () => void;
};

function formatStatusDate(value: string | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InvitationStatusIcon({ status }: { status: string }) {
  const className = `edo-diag-status edo-diag-status-${status}`;
  const symbols: Record<string, string> = {
    accepted: "✓",
    rejected: "✕",
    awaiting_consent: "…",
    requires_consent: "!",
    requires_send: "↑",
    roaming_setup: "↔",
    error: "⚠",
    not_required: "—",
    unknown: "?",
  };
  return <span className={className}>{symbols[status] ?? "?"}</span>;
}

function summarizeItem(item: EdoDiagnosticItem): {
  hasLocal: boolean;
  status: string;
  label: string;
  changedAt?: string;
} {
  if (!item.hasLocalData) {
    return { hasLocal: false, status: "none", label: "—" };
  }

  const ours = item.invitations.filter((inv) => inv.forOurOrg);
  const list = ours.length > 0 ? ours : item.invitations;
  if (list.length > 0) {
    const latest = list[0];
    return {
      hasLocal: true,
      status: latest.status,
      label: latest.statusLabel,
      changedAt: latest.statusChangedAt,
    };
  }

  if (item.inSendSettings) {
    return {
      hasLocal: true,
      status: "in_settings",
      label: "В настройках отправки",
      changedAt: item.settingsChangedAt,
    };
  }

  return { hasLocal: true, status: "unknown", label: "Есть в базе" };
}

function InvitationRow({ invitation }: { invitation: EdoDiagnosticInvitation }) {
  return (
    <li className={`edo-diag-invitation${invitation.archived ? " is-archived" : ""}`}>
      <InvitationStatusIcon status={invitation.status} />
      <span className="edo-diag-invitation-label">{invitation.statusLabel}</span>
      <span className="edo-diag-invitation-date muted">{formatStatusDate(invitation.statusChangedAt)}</span>
      {invitation.archived ? <span className="edo-diag-badge edo-diag-badge-archive">архив</span> : null}
      {!invitation.forOurOrg ? (
        <span className="edo-diag-badge edo-diag-badge-other-org muted">другая орг.</span>
      ) : null}
    </li>
  );
}

export function EdoDiagnosticsModal({
  open,
  loadingPhase,
  error,
  onlineError,
  data,
  organizationRef,
  entityRef,
  onClose,
}: EdoDiagnosticsModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    document.body.classList.add("modal-open");
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  const items = data?.items ?? [];
  const sortedItems = [...items].sort((a, b) => {
    if (a.isCurrentInDoc !== b.isCurrentInDoc) {
      return a.isCurrentInDoc ? -1 : 1;
    }
    if (a.hasAccepted !== b.hasAccepted) {
      return a.hasAccepted ? -1 : 1;
    }
    if (a.inSendSettings !== b.inSendSettings) {
      return a.inSendSettings ? -1 : 1;
    }
    return a.edoId.localeCompare(b.edoId);
  });

  const openTransport = (edoId?: string) => {
    if (organizationRef && entityRef) {
      openEdoTransportSettings(organizationRef, entityRef, edoId);
    }
  };

  const openInvitation = (edoId: string) => {
    if (organizationRef && entityRef) {
      openEdoSettings(edoId, organizationRef, entityRef);
    }
  };

  const inn = data ? formatInn(data.inn, data.kpp) : "";

  return (
    <ModalPortal open={open} onClose={onClose} cardClassName="edo-diag-card" ariaLabelledBy="edo-diag-title">
      <header className="modal-header">
        <div>
          <p className="modal-kicker">Диагностика ЭДО</p>
          <h2 id="edo-diag-title">{data?.partyName ?? "Контрагент"}</h2>
          {inn ? <p className="edo-diag-subtitle muted">{inn}</p> : null}
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </header>

      {loadingPhase === "local" ? (
        <div className="modal-loading">
          <span className="modal-loading-spinner" aria-hidden="true" />
          Чтение настроек и приглашений в базе…
        </div>
      ) : null}

      {loadingPhase === "online" ? (
        <div className="edo-diag-online-banner">
          <span className="modal-loading-spinner" aria-hidden="true" />
          Запрос полного списка ID в сервисе ЭДО по ИНН (может занять несколько минут)…
        </div>
      ) : null}

      {!loadingPhase && error ? (
        <p className="edo-diag-error" role="alert">
          {error}
        </p>
      ) : null}

      {loadingPhase !== "local" && !error && sortedItems.length === 0 ? (
        <p className="muted">Идентификаторы ЭДО для контрагента не найдены.</p>
      ) : null}

      {loadingPhase !== "local" && !error && sortedItems.length > 0 ? (
        <div className="edo-diag-table-wrap">
          <table className="edo-diag-table">
            <thead>
              <tr>
                <th>ID ЭДО</th>
                <th>Оператор</th>
                <th>Статус</th>
                <th>Изменён</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                const summary = summarizeItem(item);
                const hasInvitation = item.hasLocalData && item.invitations.some((inv) => inv.forOurOrg);
                const operator = resolveOperatorDisplay(item);
                const showInvitationLink = hasInvitation || item.hasAccepted;
                const showSettingsLink = item.inSendSettings;
                return (
                  <tr
                    key={item.edoId}
                    className={[
                      item.isCurrentInDoc ? "is-current" : "",
                      item.hasLocalData && item.inSendSettings ? "is-in-settings" : "",
                      !item.hasLocalData ? "is-online-only" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <td>
                      <div className="edo-diag-id-cell">
                        <div className="edo-diag-id-row">
                          <div className="edo-diag-id-main">
                            <Copyable value={item.edoId} mono className="edo-diag-id-copy" inline />
                          </div>
                          {(showInvitationLink || showSettingsLink) && (
                            <div className="edo-diag-id-actions">
                              {showInvitationLink ? (
                                <ExternalLinkIcon
                                  onClick={() => openInvitation(item.edoId)}
                                  title="Приглашение к обмену"
                                />
                              ) : null}
                              {showSettingsLink ? (
                                <button
                                  type="button"
                                  className="edo-diag-link-btn"
                                  onClick={() => openTransport(item.edoId)}
                                  title="Настройка обмена с этим ID"
                                >
                                  ⚙
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>
                        {item.title && item.title !== item.edoId ? (
                          <span className="edo-diag-title muted">{item.title}</span>
                        ) : null}
                        <div className="edo-diag-badges">
                          {item.isCurrentInDoc ? (
                            <span className="edo-diag-badge edo-diag-badge-current">в документе</span>
                          ) : null}
                          {item.inSendSettings ? (
                            <span className="edo-diag-badge edo-diag-badge-settings">настройки</span>
                          ) : null}
                        </div>
                        {item.hasLocalData && item.invitations.length > 1 ? (
                          <ul className="edo-diag-invitations">
                            {item.invitations.map((inv, index) => (
                              <InvitationRow key={`${inv.edoId}-${inv.statusChangedAt}-${index}`} invitation={inv} />
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </td>
                    <td className="edo-diag-operator">
                      <span className="edo-diag-operator-name">{operator.label}</span>
                      {operator.code && operator.label !== operator.code ? (
                        <span className="edo-diag-operator-code muted">{operator.code}</span>
                      ) : null}
                    </td>
                    <td>
                      {summary.hasLocal ? (
                        <div className="edo-diag-status-line">
                          <InvitationStatusIcon status={summary.status} />
                          <span>{summary.label}</span>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="edo-diag-date muted">
                      {summary.hasLocal ? formatStatusDate(summary.changedAt) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <footer className="edo-diag-footer">
        <button type="button" className="edo-diag-primary-link" onClick={() => openTransport(data?.currentEdoId)}>
          Настройка обмена с контрагентом…
        </button>
        {onlineError ? <p className="edo-diag-warning">{onlineError}</p> : null}
        {data?.loadWarning ? <p className="edo-diag-warning">{data.loadWarning}</p> : null}
        <p className="edo-diag-hint muted">
          Список ID {data?.onlineLoaded ? "загружен из сервиса ЭДО" : "взят из локальной базы"} (как при выборе
          учётной записи). Статусы и даты — только для ID с настройкой или приглашением в этой базе, включая архив.
        </p>
      </footer>
    </ModalPortal>
  );
}
