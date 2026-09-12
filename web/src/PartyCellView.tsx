import { Copyable } from "./Copyable";
import { formatInn, truncateEdoId } from "./format";
import type { PartyCell } from "./types";

function EdoStatusIcon({ party }: { party: PartyCell }) {
  if (party.isOwnOrganization || party.edoExchangeStatus === "own") {
    return (
      <span className="edo-status edo-status-own" title="Наша организация — проверка обмена не требуется">
        М
      </span>
    );
  }
  if (party.edoExchangeStatus === "accepted") {
    return <span className="edo-status edo-status-accepted" title="Обмен ЭДО принят">✓</span>;
  }
  if (party.edoExchangeStatus === "not_accepted") {
    return <span className="edo-status edo-status-rejected" title="Обмен ЭДО не принят">✕</span>;
  }
  return <span className="edo-status edo-status-unknown" title="ID ЭДО не указан">?</span>;
}

type PartyCellViewProps = {
  party: PartyCell;
  onCopied: (value: string) => void;
};

export function PartyCellView({ party, onCopied }: PartyCellViewProps) {
  const hasData = party.name || party.inn || party.edoId;

  if (!hasData) {
    return <span className="party-empty">—</span>;
  }

  const inn = formatInn(party.inn, party.kpp);

  return (
    <div className="party-stack">
      {party.name ? (
        <Copyable value={party.name} className="party-name-btn" onCopied={onCopied} />
      ) : (
        <span className="party-name-muted">Без наименования</span>
      )}
      {inn ? (
        <Copyable value={inn} className="party-inn-btn" mono onCopied={onCopied} />
      ) : (
        <span className="party-inn-muted">ИНН не указан</span>
      )}
      <div className="party-edo-line">
        <EdoStatusIcon party={party} />
        {party.edoId ? (
          <Copyable
            value={party.edoId}
            className="party-edo-btn"
            mono
            onCopied={onCopied}
          >
            {truncateEdoId(party.edoId)}
          </Copyable>
        ) : (
          <span className="party-edo-muted">ID ЭДО не указан</span>
        )}
      </div>
    </div>
  );
}
