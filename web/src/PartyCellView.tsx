import { useCallback, useState } from "react";

import { fetchEdoDiagnostics } from "./bridgeAsync";

import { openCatalogRef, openEdoSettings } from "./bridge";

import { Copyable } from "./Copyable";

import { EdoDiagnosticsModal } from "./EdoDiagnosticsModal";

import { EditIcon } from "./EditIcon";

import { ExternalLinkIcon } from "./ExternalLinkIcon";

import { formatInn, truncateEdoId } from "./format";

import type { FloatingMenuItem } from "./FloatingMenu";

import type { EdoDiagnosticsPayload, PartyCell } from "./types";



function EdoStatusIcon({ party, enriching }: { party: PartyCell; enriching: boolean }) {

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

  if (party.edoExchangeStatus === "pending") {

    if (!enriching) {

      return (

        <span className="edo-status edo-status-idle" title="Статус ЭДО будет загружен">

          —

        </span>

      );

    }

    return (

      <span className="edo-status edo-status-pending" title="Загрузка статуса ЭДО…">

        …

      </span>

    );

  }

  return <span className="edo-status edo-status-unknown" title="ID ЭДО не указан">?</span>;

}



type PartyCellViewProps = {

  party: PartyCell;

  organizationRef: string;

  enrichingEdo?: boolean;

  onCopied: (value: string) => void;

  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;

};



export function PartyCellView({ party, organizationRef, enrichingEdo = false, onCopied, onOpenMenu }: PartyCellViewProps) {

  const [diagOpen, setDiagOpen] = useState(false);

  const [diagLoading, setDiagLoading] = useState(false);

  const [diagData, setDiagData] = useState<EdoDiagnosticsPayload | null>(null);

  const [diagError, setDiagError] = useState("");



  const hasData = party.name || party.inn || party.edoId;



  const openDiagnostics = useCallback(() => {

    if (!party.entityRef || !organizationRef) {

      return;

    }

    setDiagOpen(true);

    setDiagLoading(true);

    setDiagError("");

    setDiagData(null);

    void fetchEdoDiagnostics(organizationRef, party.entityRef, party.edoId)

      .then((payload) => {

        setDiagData(payload);

        setDiagLoading(false);

      })

      .catch((error: unknown) => {

        setDiagError(error instanceof Error ? error.message : "Ошибка загрузки диагностики");

        setDiagLoading(false);

      });

  }, [organizationRef, party.edoId, party.entityRef]);



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

      openEdoSettings(party.edoId, organizationRef, party.entityRef);

    }

  };



  const canOpenDiagnostics =

    Boolean(party.entityRef) && Boolean(organizationRef) && !party.isOwnOrganization && party.entityKind === "contragent";



  const entityLinkTitle =

    party.entityKind === "organization" ? "Открыть карточку организации" : "Открыть карточку контрагента";



  const entityMenuItems: FloatingMenuItem[] = party.entityRef

    ? [{ id: "open-entity", label: entityLinkTitle, onSelect: openEntity }]

    : [];



  const edoMenuItems: FloatingMenuItem[] = [];

  if (party.edoId && organizationRef && !party.isOwnOrganization) {

    edoMenuItems.push({ id: "open-edo", label: "Приглашение к обмену", onSelect: openEdo });

  }

  if (canOpenDiagnostics) {

    edoMenuItems.push({

      id: "open-diagnostics",

      label: "Диагностика ЭДО — все ID и приглашения",

      onSelect: openDiagnostics,

    });

  }



  return (

    <>

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

          <EdoStatusIcon party={party} enriching={enrichingEdo} />

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

                  title="Приглашение к обмену ЭДО"

                  onOpenMenu={onOpenMenu}

                  menuItems={edoMenuItems}

                />

              ) : null}

              {canOpenDiagnostics ? (

                <EditIcon

                  onClick={openDiagnostics}

                  title="Диагностика ЭДО — все ID, статусы приглашений"

                  onOpenMenu={onOpenMenu}

                  menuItems={edoMenuItems}

                />

              ) : null}

            </>

          ) : party.edoExchangeStatus === "pending" && enrichingEdo ? (

            <span className="party-edo-muted party-edo-loading">загрузка…</span>

          ) : party.edoExchangeStatus === "pending" ? (

            <span className="party-edo-muted">—</span>

          ) : (

            <span className="party-edo-muted">ID ЭДО не указан</span>

          )}

          {!party.edoId && canOpenDiagnostics ? (

            <EditIcon

              onClick={openDiagnostics}

              title="Диагностика ЭДО — все ID, статусы приглашений"

              onOpenMenu={onOpenMenu}

              menuItems={edoMenuItems}

            />

          ) : null}

        </div>

      </div>



      {canOpenDiagnostics ? (

        <EdoDiagnosticsModal

          open={diagOpen}

          loading={diagLoading}

          error={diagError}

          data={diagData}

          organizationRef={organizationRef}

          entityRef={party.entityRef ?? ""}

          onClose={() => setDiagOpen(false)}

        />

      ) : null}

    </>

  );

}

