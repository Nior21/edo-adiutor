import { requestSaveDocumentXml,
  call1C,
  requestEdoDiagnosticsLocal,
  requestEdoDiagnosticsOnline,
  requestEnrichRows,
  requestListMeta,
  requestListPage,
  requestRegistryList,
  requestDocument,
  requestDocumentXml,
  requestSaveDocumentField,
  yieldToBrowser,
} from "./bridge";
import type {
  EdoDiagnosticsPayload,
  EdoOnlineIdsPayload,
  EnrichRowsPayload,
  ListMetaPayload,
  ListPagePayload,
  InitPayload,
  DocumentXmlPayload,
  EpdListItem,
  SaveDocumentFieldResult,
} from "./types";

const BRIDGE_TIMEOUT_MS = 120_000;
const DIAGNOSTICS_LOCAL_TIMEOUT_MS = 60_000;
const DIAGNOSTICS_ONLINE_TIMEOUT_MS = 600_000;

type Pending<T> = {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timer: number;
};

function armPendingWithTimeout<T>(
  slot: { current: Pending<T> | null },
  label: string,
  timeoutMs: number,
): Promise<T> {
  if (slot.current) {
    window.clearTimeout(slot.current.timer);
    slot.current.reject(new Error(`Предыдущий запрос ${label} отменён`));
  }

  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (slot.current) {
        slot.current = null;
      }
      reject(new Error(`Таймаут ${label}`));
    }, timeoutMs);

    slot.current = { resolve, reject, timer };
  });
}


const documentXmlSlot = { current: null as Pending<DocumentXmlPayload> | null };
const documentDetailSlot = { current: null as Pending<EpdListItem> | null };
const saveFieldSlot = { current: null as Pending<SaveDocumentFieldResult> | null };

const listInitSlot = { current: null as Pending<InitPayload> | null };

const metaSlot = { current: null as Pending<ListMetaPayload> | null };
const pageSlot = { current: null as Pending<ListPagePayload> | null };
const enrichSlot = { current: null as Pending<EnrichRowsPayload> | null };
const diagnosticsSlot = { current: null as Pending<EdoDiagnosticsPayload> | null };
const onlineIdsSlot = { current: null as Pending<EdoOnlineIdsPayload> | null };

function settle<T>(slot: { current: Pending<T> | null }, value: T): void {
  if (!slot.current) {
    return;
  }
  window.clearTimeout(slot.current.timer);
  slot.current.resolve(value);
  slot.current = null;
}

function fail<T>(slot: { current: Pending<T> | null }, message: string): void {
  if (!slot.current) {
    return;
  }
  window.clearTimeout(slot.current.timer);
  slot.current.reject(new Error(message));
  slot.current = null;
}

export const bridgeAsync = {
  resolveListMeta(payload: ListMetaPayload): void {
    settle(metaSlot, payload);
  },
  rejectListMeta(message: string): void {
    fail(metaSlot, message);
  },
  resolveDocumentXml(payload: DocumentXmlPayload): void {
    settle(documentXmlSlot, payload);
  },
  rejectDocumentXml(message: string): void {
    fail(documentXmlSlot, message);
  },
  resolveDocumentDetail(item: EpdListItem): void {
    settle(documentDetailSlot, item);
  },
  rejectDocumentDetail(message: string): void {
    fail(documentDetailSlot, message);
  },
  resolveSaveDocumentField(payload: SaveDocumentFieldResult): void {
    settle(saveFieldSlot, payload);
  },
  rejectSaveDocumentField(message: string): void {
    fail(saveFieldSlot, message);
  },
  resolveListInit(payload: InitPayload): void {
    settle(listInitSlot, payload);
  },
  rejectListInit(message: string): void {
    fail(listInitSlot, message);
  },
  resolveListPage(payload: ListPagePayload): void {

    settle(pageSlot, payload);
  },
  rejectListPage(message: string): void {
    fail(pageSlot, message);
  },
  resolveEnrichRows(payload: EnrichRowsPayload): void {
    settle(enrichSlot, payload);
  },
  rejectEnrichRows(message: string): void {
    fail(enrichSlot, message);
  },
  resolveEdoDiagnostics(payload: EdoDiagnosticsPayload): void {
    settle(diagnosticsSlot, payload);
  },
  rejectEdoDiagnostics(message: string): void {
    fail(diagnosticsSlot, message);
  },
  resolveEdoOnlineIds(payload: EdoOnlineIdsPayload): void {
    settle(onlineIdsSlot, payload);
  },
  rejectEdoOnlineIds(message: string): void {
    fail(onlineIdsSlot, message);
  },
};

export async function saveDocumentXmlFile(ref: string, docType: string, fileRef: string): Promise<DocumentXmlPayload> {
  const promise = armPendingWithTimeout(documentXmlSlot, "saveDocumentXml", BRIDGE_TIMEOUT_MS);
  requestSaveDocumentXml(ref, docType, fileRef);
  return promise;
}

export async function fetchDocumentXml(ref: string, docType: string, fileRef: string): Promise<DocumentXmlPayload> {
  const promise = armPendingWithTimeout(documentXmlSlot, "getDocumentXml", BRIDGE_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestDocumentXml(ref, docType, fileRef);
  return promise;
}

export async function saveDocumentField(
  ref: string,
  docType: string,
  fieldId: string,
  value: string,
): Promise<SaveDocumentFieldResult> {
  const promise = armPendingWithTimeout(saveFieldSlot, "saveDocumentField", BRIDGE_TIMEOUT_MS);
  requestSaveDocumentField(ref, docType, fieldId, value);
  return promise;
}

export async function fetchDocumentDetail(ref: string, docType: string): Promise<EpdListItem> {
  const promise = armPendingWithTimeout(documentDetailSlot, "getDocument", BRIDGE_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestDocument(ref, docType);
  return promise;
}

export async function fetchRegistryList(): Promise<InitPayload> {
  const promise = armPendingWithTimeout(listInitSlot, "getList", BRIDGE_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestRegistryList();
  return promise;
}

export async function fetchListMeta(): Promise<ListMetaPayload> {
  const promise = armPendingWithTimeout(metaSlot, "getListMeta", BRIDGE_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestListMeta();
  return promise;
}

export async function fetchListPage(offset: number, limit: number): Promise<ListPagePayload> {
  const promise = armPendingWithTimeout(pageSlot, "getListPage", BRIDGE_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestListPage(offset, limit);
  return promise;
}

export async function fetchEnrichRows(refs: string[]): Promise<EnrichRowsPayload> {
  const promise = armPendingWithTimeout(enrichSlot, "enrichRows", BRIDGE_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestEnrichRows(refs);
  return promise;
}

export async function fetchEdoDiagnosticsLocal(
  orgRef: string,
  entityRef: string,
  edoId?: string,
): Promise<EdoDiagnosticsPayload> {
  const promise = armPendingWithTimeout(diagnosticsSlot, "getEdoDiagnosticsLocal", DIAGNOSTICS_LOCAL_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestEdoDiagnosticsLocal(orgRef, entityRef, edoId);
  return promise;
}

export async function fetchEdoDiagnosticsOnline(orgRef: string, entityRef: string): Promise<EdoOnlineIdsPayload> {
  const promise = armPendingWithTimeout(onlineIdsSlot, "getEdoDiagnosticsOnline", DIAGNOSTICS_ONLINE_TIMEOUT_MS);
  await yieldToBrowser(16);
  requestEdoDiagnosticsOnline(orgRef, entityRef);
  return promise;
}

/** Пинг без серверной нагрузки — проверка, что мост жив (action=ready). */
export function pingReady(): void {
  call1C({ action: "ready" });
}
