import type { BridgeAction } from "./types";

/** Пауза между короткими вызовами onec: — WebKit успевает отрисовать кадр анимации. */
export const BRIDGE_YIELD_MS = 48;

function getBridgeLink(): HTMLAnchorElement {
  const link = document.getElementById("bridge-link");
  if (!(link instanceof HTMLAnchorElement)) {
    throw new Error("bridge-link not found");
  }
  return link;
}

function buildHref(payload: BridgeAction): string {
  const params = new URLSearchParams();
  params.set("action", payload.action);

  if ("ref" in payload && payload.ref !== undefined) {
    params.set("ref", payload.ref ?? "");
  }

  if ("docType" in payload && payload.docType !== undefined) {
    params.set("docType", payload.docType ?? "");
  }

  if ("comment" in payload && payload.comment !== undefined) {
    params.set("comment", payload.comment ?? "");
  }

  if ("edoId" in payload && payload.edoId !== undefined) {
    params.set("edoId", payload.edoId ?? "");
  }

  if ("orgRef" in payload && payload.orgRef !== undefined) {
    params.set("orgRef", payload.orgRef ?? "");
  }

  if ("entityRef" in payload && payload.entityRef !== undefined) {
    params.set("entityRef", payload.entityRef ?? "");
  }

  if ("offset" in payload && payload.offset !== undefined) {
    params.set("offset", payload.offset ?? "0");
  }

  if ("limit" in payload && payload.limit !== undefined) {
    params.set("limit", payload.limit ?? "20");
  }

  if ("refs" in payload && payload.refs !== undefined) {
    params.set("refs", payload.refs ?? "");
  }

  if ("targetPath" in payload && payload.targetPath !== undefined) {
    params.set("targetPath", payload.targetPath ?? "");
  }

  if ("releaseVer" in payload && payload.releaseVer !== undefined) {
    params.set("releaseVer", payload.releaseVer ?? "");
  }

  if ("epfUrl" in payload && payload.epfUrl !== undefined) {
    params.set("epfUrl", payload.epfUrl ?? "");
  }

  return `onec:bridge?${params.toString()}`;
}

export function call1C(payload: BridgeAction): void {
  const link = getBridgeLink();
  link.href = buildHref(payload);
  link.click();
}

export function yieldToBrowser(delayMs = BRIDGE_YIELD_MS): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, delayMs);
      });
    });
  });
}

export function notifyReady(): void {
  call1C({ action: "ready" });
}

export function requestListMeta(): void {
  call1C({ action: "getListMeta" });
}

export function requestListPage(offset: number, limit: number): void {
  call1C({ action: "getListPage", offset: String(offset), limit: String(limit) });
}

export function requestEnrichRows(refs: string[]): void {
  call1C({ action: "enrichRows", refs: refs.join(",") });
}

export function requestDocument(ref: string, docType: string): void {
  call1C({ action: "getDocument", ref, docType });
}

export function saveComment(ref: string, docType: string, comment: string): void {
  call1C({ action: "saveComment", ref, docType, comment });
}

export function openDocument(ref: string, docType: string): void {
  call1C({ action: "openDocument", ref, docType });
}

export function openCatalogRef(ref: string): void {
  call1C({ action: "openCatalog", ref });
}

export function openEdoSettings(edoId: string, orgRef: string, entityRef?: string): void {
  call1C({ action: "openEdoSettings", edoId, orgRef, entityRef: entityRef ?? "" });
}

/** Список настроек отправки по контрагенту (все обмены, договоры, выбор ID). */
export function openEdoSendSettings(entityRef: string): void {
  call1C({ action: "openEdoSendSettings", entityRef });
}

export function requestEdoDiagnostics(orgRef: string, entityRef: string, edoId?: string): void {
  call1C({ action: "getEdoDiagnostics", orgRef, entityRef, edoId: edoId ?? "" });
}

export function requestEdoDiagnosticsLocal(orgRef: string, entityRef: string, edoId?: string): void {
  call1C({ action: "getEdoDiagnosticsLocal", orgRef, entityRef, edoId: edoId ?? "" });
}

export function requestEdoDiagnosticsOnline(orgRef: string, entityRef: string): void {
  call1C({ action: "getEdoDiagnosticsOnline", orgRef, entityRef, edoId: "" });
}

export function requestCheckUpdate(): void {
  call1C({ action: "checkUpdate" });
}

export function requestPickEpfPath(): void {
  call1C({ action: "pickEpfPath" });
}

export function requestApplyUpdate(targetPath?: string, releaseVer?: string, epfUrl?: string): void {
  call1C({
    action: "applyUpdate",
    targetPath: targetPath ?? "",
    releaseVer: releaseVer ?? "",
    epfUrl: epfUrl ?? "",
  });
}

export function requestOpenRelease(releaseVer: string): void {
  call1C({ action: "openRelease", releaseVer });
}

/** Форма НастройкаОбменаСКонтрагентом — выбор активного ID в настройках отправки. */
export function openEdoTransportSettings(orgRef: string, entityRef: string, edoId?: string): void {
  call1C({ action: "openEdoTransportSettings", orgRef, entityRef, edoId: edoId ?? "" });
}
