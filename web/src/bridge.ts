import type { BridgeAction } from "./types";

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

  if ("ref" in payload) {
    params.set("ref", payload.ref ?? "");
  }

  if ("docType" in payload) {
    params.set("docType", payload.docType ?? "");
  }

  if ("comment" in payload) {
    params.set("comment", payload.comment ?? "");
  }

  if ("edoId" in payload) {
    params.set("edoId", payload.edoId ?? "");
  }

  if ("orgRef" in payload) {
    params.set("orgRef", payload.orgRef ?? "");
  }

  return `onec:bridge?${params.toString()}`;
}

export function call1C(payload: BridgeAction): void {
  const link = getBridgeLink();
  link.href = buildHref(payload);
  link.click();
}

export function notifyReady(): void {
  call1C({ action: "ready" });
}

export function requestList(): void {
  call1C({ action: "getList" });
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

export function openEdoSettings(edoId: string, orgRef: string): void {
  call1C({ action: "openEdoSettings", edoId, orgRef });
}
