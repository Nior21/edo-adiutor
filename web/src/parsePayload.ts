import type { EpdListItem, InitPayload } from "./types";

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
  const fallback: InitPayload = { version: "0.3.1", items: [] };
  const payload = parseJsonValue<InitPayload | null>(value, null);
  if (!payload || typeof payload !== "object") {
    return fallback;
  }
  return {
    version: payload.version ?? fallback.version,
    items: Array.isArray(payload.items) ? payload.items : [],
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
