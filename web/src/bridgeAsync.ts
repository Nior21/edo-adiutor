import {
  call1C,
  requestEdoDiagnostics,
  requestEnrichRows,
  requestListMeta,
  requestListPage,
  yieldToBrowser,
} from "./bridge";
import type { EdoDiagnosticsPayload, EnrichRowsPayload, ListMetaPayload, ListPagePayload } from "./types";

const BRIDGE_TIMEOUT_MS = 120_000;

type Pending<T> = {
  resolve: (value: T) => void;
  reject: (reason: Error) => void;
  timer: number;
};

let pendingMeta: Pending<ListMetaPayload> | null = null;
let pendingPage: Pending<ListPagePayload> | null = null;
let pendingEnrich: Pending<EnrichRowsPayload> | null = null;
let pendingDiagnostics: Pending<EdoDiagnosticsPayload> | null = null;

function armPending<T>(slot: { current: Pending<T> | null }, label: string): Promise<T> {
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
    }, BRIDGE_TIMEOUT_MS);

    slot.current = { resolve, reject, timer };
  });
}

const metaSlot = { current: null as Pending<ListMetaPayload> | null };
const pageSlot = { current: null as Pending<ListPagePayload> | null };
const enrichSlot = { current: null as Pending<EnrichRowsPayload> | null };
const diagnosticsSlot = { current: null as Pending<EdoDiagnosticsPayload> | null };

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
};

export async function fetchListMeta(): Promise<ListMetaPayload> {
  const promise = armPending(metaSlot, "getListMeta");
  await yieldToBrowser(16);
  requestListMeta();
  return promise;
}

export async function fetchListPage(offset: number, limit: number): Promise<ListPagePayload> {
  const promise = armPending(pageSlot, "getListPage");
  await yieldToBrowser(16);
  requestListPage(offset, limit);
  return promise;
}

export async function fetchEnrichRows(refs: string[]): Promise<EnrichRowsPayload> {
  const promise = armPending(enrichSlot, "enrichRows");
  await yieldToBrowser(16);
  requestEnrichRows(refs);
  return promise;
}

export async function fetchEdoDiagnostics(
  orgRef: string,
  entityRef: string,
  edoId?: string,
): Promise<EdoDiagnosticsPayload> {
  const promise = armPending(diagnosticsSlot, "getEdoDiagnostics");
  await yieldToBrowser(16);
  requestEdoDiagnostics(orgRef, entityRef, edoId);
  return promise;
}

/** Пинг без серверной нагрузки — проверка, что мост жив (action=ready). */
export function pingReady(): void {
  call1C({ action: "ready" });
}
