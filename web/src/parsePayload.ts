import { normalizeCommentRaw } from "./commentDisplay";
import type {
  EdoDiagnosticsPayload,
  EdoOnlineIdsPayload,
  EnrichRowsPayload,
  EpdListItem,
  InitPayload,
  ListMetaPayload,
  ListPagePayload,
  UpdateInfoPayload,
  DocumentXmlPayload,
} from "./types";

function normalizeEpdListItem(item: EpdListItem): EpdListItem {
  return {
    ...item,
    comment: normalizeCommentRaw(item.comment),
  };
}

function normalizeEpdListItems(items: EpdListItem[]): EpdListItem[] {
  return items.map((item) => normalizeEpdListItem(item));
}

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
    items: normalizeEpdListItems(Array.isArray(payload.items) ? payload.items : []),
  };
}

export function parseListMetaPayload(value: unknown): { meta: ListMetaPayload | null; error: string } {
  const payload = parseJsonValue<{ error?: string; version?: string; total?: number } | null>(value, null);
  if (!payload || typeof payload !== "object") {
    return { meta: null, error: "Пустой ответ метаданных" };
  }
  if ("error" in payload) {
    return { meta: null, error: payload.error || "Запрос метаданных отменён" };
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
      items: normalizeEpdListItems(Array.isArray(payload.items) ? payload.items : []),
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

export function parseUpdateInfoPayload(value: unknown): UpdateInfoPayload | null {
  const parsed = parseJsonValue<UpdateInfoPayload | null>(value, null);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  let phase: UpdateInfoPayload["phase"] = "check";
  if (parsed.phase === "apply") {
    phase = "apply";
  } else if (parsed.phase === "resumeAfterReload") {
    phase = "resumeAfterReload";
  } else if (parsed.phase === "superseded" || parsed.uiMode === "superseded") {
    phase = "superseded";
  }
  const uiMode = parsed.uiMode === "superseded" ? "superseded" : "normal";
  const localReleases = Array.isArray(parsed.localReleases)
    ? parsed.localReleases
        .map((row) => {
          if (!row || typeof row !== "object") {
            return null;
          }
          const version = "version" in row && typeof row.version === "string" ? row.version : "";
          if (!version) {
            return null;
          }
          const path = "path" in row && typeof row.path === "string" ? row.path : "";
          return { version, path };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
    : [];

  const versionCatalog = Array.isArray(parsed.versionCatalog)
    ? parsed.versionCatalog
        .map((row) => {
          if (!row || typeof row !== "object") {
            return null;
          }
          const version = "version" in row && typeof row.version === "string" ? row.version : "";
          if (!version) {
            return null;
          }
          const path = "path" in row && typeof row.path === "string" ? row.path : "";
          const kindRaw = "kind" in row && typeof row.kind === "string" ? row.kind : "local";
          const kind =
            kindRaw === "current" || kindRaw === "remote" || kindRaw === "local" ? kindRaw : ("local" as const);
          const installed = "installed" in row ? row.installed === true : kind !== "remote";
          const epfUrl = "epfUrl" in row && typeof row.epfUrl === "string" ? row.epfUrl : "";
          return { version, path, kind, installed, epfUrl };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
    : [];

  return {
    phase,
    uiMode,
    currentVersion: parsed.currentVersion ?? "",
    latestVersion: parsed.latestVersion ?? "",
    remoteLatestVersion: parsed.remoteLatestVersion ?? "",
    targetVersion: parsed.targetVersion ?? "",
    localLatestVersion: parsed.localLatestVersion ?? "",
    localHasTarget: parsed.localHasTarget === true,
    localReleases,
    versionCatalog,
    updateAvailable: parsed.updateAvailable === true,
    autoSwitchRecommended: parsed.autoSwitchRecommended === true,
    manifestConfigured: parsed.manifestConfigured === true,
    epfPath: parsed.epfPath ?? "",
    epfUrl: parsed.epfUrl ?? "",
    notes: parsed.notes ?? "",
    error: parsed.error ?? "",
    success: parsed.success === true,
    message: parsed.message ?? "",
    targetPath: parsed.targetPath ?? "",
    launchedVersion: parsed.launchedVersion ?? "",
    launchedPath: parsed.launchedPath ?? "",
    anchorReplaced: parsed.anchorReplaced === true,
    openedNewWindow: parsed.openedNewWindow === true,
    reloadedInPlace: parsed.reloadedInPlace === true,
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
  return { item: normalizeEpdListItem(payload as EpdListItem), error: "" };
}


export function parseDocumentXmlPayload(value: unknown): DocumentXmlPayload {
  const fallback: DocumentXmlPayload = { success: false, fileName: "", dataBase64: "", error: "Пустой ответ" };
  const parsed = parseJsonValue<Partial<DocumentXmlPayload>>(value, fallback);
  return {
    success: Boolean(parsed.success),
    fileName: String(parsed.fileName ?? ""),
    dataBase64: String(parsed.dataBase64 ?? ""),
    error: parsed.error ? String(parsed.error) : undefined,
  };
}
