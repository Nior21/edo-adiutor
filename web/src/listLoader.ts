import { fetchEnrichRows, fetchListMeta, fetchListPage } from "./bridgeAsync";
import { yieldToBrowser } from "./bridge";
import type { EpdListItem, PartyCell } from "./types";

/** По одной строке — точная шкала и анимация только на текущем элементе. */
export const LIST_PAGE_SIZE = 1;
export const ENRICH_BATCH_SIZE = 1;

export type ListLoadProgress = {
  phase: "meta" | "pages" | "enrich" | "done";
  loaded: number;
  total: number;
  enriched: number;
  /** Идёт запрос следующей строки реестра (показываем skeleton-строку). */
  fetchingRow: boolean;
  /** Строка, для которой сейчас запрашиваются ЭДО/статусы. */
  enrichingRef: string | null;
};

export type ListLoadCallbacks = {
  onProgress: (progress: ListLoadProgress) => void;
  onVersion: (version: string) => void;
  onAppendPage: (items: EpdListItem[]) => void;
  onEnrichBatch: (updates: Array<{ ref: string; shipper: PartyCell; carrier: PartyCell; consignee: PartyCell }>) => void;
  onError: (message: string) => void;
};

let loadGeneration = 0;

export function cancelListLoad(): void {
  loadGeneration += 1;
}

function report(
  callbacks: ListLoadCallbacks,
  progress: Omit<ListLoadProgress, "fetchingRow" | "enrichingRef"> & Partial<Pick<ListLoadProgress, "fetchingRow" | "enrichingRef">>,
): void {
  callbacks.onProgress({
    fetchingRow: progress.fetchingRow ?? false,
    enrichingRef: progress.enrichingRef ?? null,
    phase: progress.phase,
    loaded: progress.loaded,
    total: progress.total,
    enriched: progress.enriched,
  });
}

export async function loadRegistryPaginated(callbacks: ListLoadCallbacks): Promise<void> {
  const generation = ++loadGeneration;

  const alive = () => generation === loadGeneration;

  try {
    report(callbacks, { phase: "meta", loaded: 0, total: 0, enriched: 0 });

    const meta = await fetchListMeta();
    if (!alive()) {
      return;
    }

    callbacks.onVersion(meta.version);
    report(callbacks, { phase: "pages", loaded: 0, total: meta.total, enriched: 0 });

    if (meta.total === 0) {
      report(callbacks, { phase: "done", loaded: 0, total: 0, enriched: 0 });
      return;
    }

    let offset = 0;
    const allRefs: string[] = [];

    while (offset < meta.total) {
      await yieldToBrowser();
      if (!alive()) {
        return;
      }

      report(callbacks, {
        phase: "pages",
        loaded: offset,
        total: meta.total,
        enriched: 0,
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
      for (const item of page.items) {
        allRefs.push(item.ref);
      }

      offset += page.items.length;
      report(callbacks, {
        phase: "pages",
        loaded: offset,
        total: page.total || meta.total,
        enriched: 0,
        fetchingRow: offset < meta.total,
      });

      if (page.items.length < LIST_PAGE_SIZE) {
        break;
      }
    }

    report(callbacks, {
      phase: "enrich",
      loaded: allRefs.length,
      total: meta.total,
      enriched: 0,
    });

    let enriched = 0;
    for (let index = 0; index < allRefs.length; index += ENRICH_BATCH_SIZE) {
      await yieldToBrowser();
      if (!alive()) {
        return;
      }

      const batch = allRefs.slice(index, index + ENRICH_BATCH_SIZE);
      report(callbacks, {
        phase: "enrich",
        loaded: allRefs.length,
        total: meta.total,
        enriched,
        enrichingRef: batch[0] ?? null,
      });

      const result = await fetchEnrichRows(batch);
      if (!alive()) {
        return;
      }

      if (result.updates.length > 0) {
        callbacks.onEnrichBatch(result.updates);
      }

      enriched += batch.length;
      report(callbacks, {
        phase: "enrich",
        loaded: allRefs.length,
        total: meta.total,
        enriched,
        enrichingRef: null,
      });
    }

    if (!alive()) {
      return;
    }

    report(callbacks, {
      phase: "done",
      loaded: allRefs.length,
      total: meta.total,
      enriched: allRefs.length,
    });
  } catch (error) {
    if (!alive()) {
      return;
    }
    const message = error instanceof Error ? error.message : "Ошибка загрузки реестра";
    callbacks.onError(message);
  }
}
