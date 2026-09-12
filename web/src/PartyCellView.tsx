import { openCatalogRef, openEdoSettings } from "./bridge";
import { Copyable } from "./Copyable";
import { ExternalLinkIcon } from "./ExternalLinkIcon";
import { formatInn, truncateEdoId } from "./format";
import type { FloatingMenuItem } from "./FloatingMenu";
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
  organizationRef: string;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function PartyCellView({ party, organizationRef, onCopied, onOpenMenu }: PartyCellViewProps) {
  const hasData = party.name || party.inn || party.edoId;

  if (!hasData) {
    return <span className="party-empty">—</span>;
  }

  const inn = formatInn(party.inn, party.kpp);

  const openEntity = () => {
    if (party.entityRef) {
      openCatalogRef(party.entityRef);
    }
  };

  const openEdo = () => {
    if (party.edoId && organizationRef) {
      openEdoSettings(party.edoId, organizationRef);
    }
  };

  const entityLinkTitle =
    party.entityKind === "organization" ? "Открыть карточку организации" : "Открыть карточку контрагента";

  const entityMenuItems: FloatingMenuItem[] = party.entityRef
    ? [{ id: "open-entity", label: entityLinkTitle, onSelect: openEntity }]
    : [];

  const edoMenuItems: FloatingMenuItem[] =
    party.edoId && organizationRef && !party.isOwnOrganization
      ? [{ id: "open-edo", label: "Настройки ЭДО", onSelect: openEdo }]
      : [];

  return (
    <div className="party-stack">
      <div className="party-inline-line">
        {party.name ? (
          <>
            <Copyable
              value={party.name}
              className="party-name-btn"
              onCopied={onCopied}
              onOpenMenu={onOpenMenu}
              extraMenuItems={entityMenuItems.map((item) => ({ label: item.label, onSelect: item.onSelect }))}
            />
            {party.entityRef ? (
              <ExternalLinkIcon
                onClick={openEntity}
                title={entityLinkTitle}
                onOpenMenu={onOpenMenu}
                menuItems={entityMenuItems}
              />
            ) : null}
          </>
        ) : (
          <span className="party-name-muted">Без наименования</span>
        )}
      </div>
      {inn ? (
        <Copyable value={inn} className="party-inn-btn" mono onCopied={onCopied} onOpenMenu={onOpenMenu} />
      ) : (
        <span className="party-inn-muted">ИНН не указан</span>
      )}
      <div className="party-edo-line">
        <EdoStatusIcon party={party} />
        {party.edoId ? (
          <>
            <Copyable
              value={party.edoId}
              className="party-edo-btn"
              mono
              onCopied={onCopied}
              onOpenMenu={onOpenMenu}
              extraMenuItems={edoMenuItems.map((item) => ({ label: item.label, onSelect: item.onSelect }))}
            >
              {truncateEdoId(party.edoId)}
            </Copyable>
            {organizationRef && !party.isOwnOrganization ? (
              <ExternalLinkIcon
                onClick={openEdo}
                title="Настройки ЭДО"
                onOpenMenu={onOpenMenu}
                menuItems={edoMenuItems}
              />
            ) : null}
          </>
        ) : (
          <span className="party-edo-muted">ID ЭДО не указан</span>
        )}
      </div>
    </div>
  );
}
