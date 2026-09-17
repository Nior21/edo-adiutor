import { fetchListMeta, fetchListPage } from "./bridgeAsync";
import { yieldToBrowser } from "./bridge";
import type { EpdListItem } from "./types";

/** Строк за один запрос к 1С (лимит на сервере — 50). */
export const LIST_PAGE_SIZE = 50;

export type ListLoadProgress = {
  phase: "meta" | "pages" | "done";
  loaded: number;
  total: number;
  /** Идёт запрос очередной страницы (показываем skeleton). */
  fetchingRow: boolean;
};

export type ListLoadCallbacks = {
  onProgress: (progress: ListLoadProgress) => void;
  onVersion: (version: string) => void;
  onAppendPage: (items: EpdListItem[]) => void;
  onError: (message: string) => void;
};

let loadGeneration = 0;

export function cancelListLoad(): void {
  loadGeneration += 1;
}

function report(
  callbacks: ListLoadCallbacks,
  progress: ListLoadProgress,
): void {
  callbacks.onProgress(progress);
}

export async function loadRegistryPaginated(callbacks: ListLoadCallbacks): Promise<void> {
  const generation = ++loadGeneration;

  const alive = () => generation === loadGeneration;

  try {
    report(callbacks, { phase: "meta", loaded: 0, total: 0, fetchingRow: false });

    const meta = await fetchListMeta();
    if (!alive()) {
      return;
    }

    callbacks.onVersion(meta.version);
    report(callbacks, { phase: "pages", loaded: 0, total: meta.total, fetchingRow: false });

    if (meta.total === 0) {
      report(callbacks, { phase: "done", loaded: 0, total: 0, fetchingRow: false });
      return;
    }

    let offset = 0;

    while (offset < meta.total) {
      await yieldToBrowser();
      if (!alive()) {
        return;
      }

      report(callbacks, {
        phase: "pages",
        loaded: offset,
        total: meta.total,
        fetchingRow: true,
      });

      const page = await fetchListPage(offset, LIST_PAGE_SIZE);
      if (!alive()) {
        return;
      }

      if (page.items.length === 0) {
        break;
      }

      callbacks.onAppendPage(page.items);
      offset += page.items.length;

      report(callbacks, {
        phase: "pages",
        loaded: offset,
        total: page.total || meta.total,
        fetchingRow: offset < meta.total,
      });

      if (page.items.length < LIST_PAGE_SIZE) {
        break;
      }
    }

    if (!alive()) {
      return;
    }

    report(callbacks, {
      phase: "done",
      loaded: offset,
      total: meta.total,
      fetchingRow: false,
    });
  } catch (error) {
    if (!alive()) {
      return;
    }
    const message = error instanceof Error ? error.message : "Ошибка загрузки реестра";
    callbacks.onError(message);
  }
}
