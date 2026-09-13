import type {
  EdoDiagnosticsPayload,
  EdoOnlineIdsPayload,
  EnrichRowsPayload,
  EpdListItem,
  InitPayload,
  ListMetaPayload,
  ListPagePayload,
} from "./types";

export function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "object") {
    return value as T;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed === "undefined") {
    return fallback;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return fallback;
  }
}

export function parseInitPayload(value: unknown): InitPayload {
  const fallback: InitPayload = { version: "0.4.0", items: [] };
  const payload = parseJsonValue<InitPayload | null>(value, null);
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  return {
    version: payload.version ?? fallback.version,
    items: Array.isArray(payload.items) ? payload.items : [],
  };
}

export function parseListMetaPayload(value: unknown): { meta: ListMetaPayload | null; error: string } {
  const payload = parseJsonValue<{ error?: string; version?: string; total?: number } | null>(value, null);
  if (!payload || typeof payload !== "object") {
    return { meta: null, error: "Пустой ответ метаданных" };
  }
  if (payload.error) {
    return { meta: null, error: payload.error };
  }
  return {
    meta: {
      version: payload.version ?? "0.4.0",
      total: typeof payload.total === "number" ? payload.total : 0,
    },
    error: "",
  };
}

export function parseListPagePayload(value: unknown): { page: ListPagePayload | null; error: string } {
  const payload = parseJsonValue<{ error?: string } & ListPagePayload | null>(value, null);
  if (!payload || typeof payload !== "object") {
    return { page: null, error: "Пустой ответ страницы" };
  }
  if (payload.error) {
    return { page: null, error: payload.error };
  }
  return {
    page: {
      offset: payload.offset ?? 0,
      limit: payload.limit ?? 0,
      total: payload.total ?? 0,
      items: Array.isArray(payload.items) ? payload.items : [],
    },
    error: "",
  };
}

export function parseEnrichRowsPayload(value: unknown): { payload: EnrichRowsPayload | null; error: string } {
  const parsed = parseJsonValue<{ error?: string; updates?: EnrichRowsPayload["updates"] } | null>(value, null);
  if (!parsed || typeof parsed !== "object") {
    return { payload: null, error: "Пустой ответ обогащения" };
  }
  if (parsed.error) {
    return { payload: null, error: parsed.error };
  }
  return {
    payload: {
      updates: Array.isArray(parsed.updates) ? parsed.updates : [],
    },
    error: "",
  };
}

export function parseEdoDiagnosticsPayload(value: unknown): { data: EdoDiagnosticsPayload | null; error: string } {
  const payload = parseJsonValue<{ error?: string } & EdoDiagnosticsPayload | null>(value, null);
  if (!payload || typeof payload !== "object") {
    return { data: null, error: "Пустой ответ диагностики ЭДО" };
  }
  if (payload.error) {
    return { data: null, error: payload.error };
  }
  return {
    data: {
      partyName: payload.partyName ?? "",
      inn: payload.inn ?? "",
      kpp: payload.kpp ?? "",
      orgEdoId: payload.orgEdoId ?? "",
      currentEdoId: payload.currentEdoId ?? "",
      onlineLoaded: payload.onlineLoaded === true,
      loadWarning: payload.loadWarning ?? "",
      items: Array.isArray(payload.items) ? payload.items : [],
    },
    error: "",
  };
}

export function parseEdoOnlineIdsPayload(value: unknown): { payload: EdoOnlineIdsPayload | null; error: string } {
  const parsed = parseJsonValue<{ error?: string; onlineItems?: EdoOnlineIdsPayload["onlineItems"] } & EdoOnlineIdsPayload | null>(
    value,
    null,
  );
  if (!parsed || typeof parsed !== "object") {
    return { payload: null, error: "Пустой ответ онлайн-ID" };
  }
  if (parsed.error) {
    return {
      payload: {
        onlineItems: [],
        onlineLoaded: false,
        loadWarning: parsed.error,
        error: parsed.error,
      },
      error: parsed.error,
    };
  }
  return {
    payload: {
      onlineItems: Array.isArray(parsed.onlineItems) ? parsed.onlineItems : [],
      onlineLoaded: parsed.onlineLoaded === true,
      loadWarning: parsed.loadWarning ?? "",
    },
    error: "",
  };
}

export function parseDocumentPayload(value: unknown): { item: EpdListItem | null; error: string } {
  const payload = parseJsonValue<{ error?: string } & EpdListItem | null>(value, null);
  if (!payload || typeof payload !== "object") {
    return { item: null, error: "Пустой ответ сервера" };
  }
  if ("error" in payload && payload.error) {
    return { item: null, error: payload.error };
  }
  if (!("ref" in payload) || !payload.ref) {
    return { item: null, error: "Некорректная структура документа" };
  }
  return { item: payload as EpdListItem, error: "" };
}
