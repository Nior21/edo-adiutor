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



  if ("ref" in payload && payload.ref) {

    params.set("ref", payload.ref);

  }

  if ("comment" in payload && payload.comment) {

    params.set("comment", payload.comment);

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



export function requestDocument(ref: string): void {

  call1C({ action: "getDocument", ref });

}



export function saveComment(ref: string, comment: string): void {

  call1C({ action: "saveComment", ref, comment });

}


