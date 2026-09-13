import { yieldToBrowser } from "./bridge";
import { fetchEdoDiagnosticsLocal, fetchEdoDiagnosticsOnline } from "./bridgeAsync";
import type { EdoDiagnosticsPayload, EdoOnlineIdsPayload } from "./types";

export type EdoDiagnosticsLoadPhase = "local" | "online" | null;

function emptyDiagnosticItem(edoId: string, title: string): EdoDiagnosticsPayload["items"][number] {
  return {
    edoId,
    title,
    source: "online",
    inSendSettings: false,
    isCurrentInDoc: false,
    hasAccepted: false,
    hasArchived: false,
    hasLocalData: false,
    invitations: [],
  };
}

export function mergeOnlineIntoDiagnostics(
  local: EdoDiagnosticsPayload,
  online: EdoOnlineIdsPayload,
): EdoDiagnosticsPayload {
  const map = new Map(local.items.map((item) => [item.edoId, { ...item }]));
  const order: string[] = [];

  for (const row of online.onlineItems) {
    const edoId = row.edoId.trim();
    if (!edoId) {
      continue;
    }
    order.push(edoId);
    const existing = map.get(edoId);
    if (existing) {
      existing.title = row.title || existing.title;
      existing.source = "online";
    } else {
      map.set(edoId, emptyDiagnosticItem(edoId, row.title || edoId));
    }
  }

  for (const item of local.items) {
    if (!order.includes(item.edoId)) {
      order.push(item.edoId);
    }
  }

  const warnings = [local.loadWarning, online.loadWarning].filter(Boolean);
  const currentEdoId = local.currentEdoId.trim();
  return {
    ...local,
    onlineLoaded: online.onlineLoaded,
    loadWarning: warnings.join(" "),
    items: order
      .map((edoId) => {
        const item = map.get(edoId);
        if (!item) {
          return null;
        }
        if (currentEdoId) {
          item.isCurrentInDoc = item.edoId === currentEdoId;
        }
        return item;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
}

export async function loadEdoDiagnosticsTwoPhase(
  orgRef: string,
  entityRef: string,
  edoId: string | undefined,
  onPhase: (phase: EdoDiagnosticsLoadPhase, data: EdoDiagnosticsPayload | null, onlineError?: string) => void,
): Promise<void> {
  onPhase("local", null);
  await yieldToBrowser(48);

  let local: EdoDiagnosticsPayload;
  try {
    local = await fetchEdoDiagnosticsLocal(orgRef, entityRef, edoId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка локальной диагностики";
    throw new Error(message);
  }

  onPhase("online", local);
  await yieldToBrowser(48);

  try {
    const online = await fetchEdoDiagnosticsOnline(orgRef, entityRef);
    if (online.error) {
      onPhase(null, {
        ...local,
        loadWarning: [local.loadWarning, online.error].filter(Boolean).join(" "),
      }, online.error);
      return;
    }
    onPhase(null, mergeOnlineIntoDiagnostics(local, online));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки ID из сервиса ЭДО";
    onPhase(
      null,
      {
        ...local,
        loadWarning: [local.loadWarning, message].filter(Boolean).join(" "),
      },
      message,
    );
  }
}
