import { fetchRegistryList } from "./bridgeAsync";
import type { EpdListItem, InitPayload } from "./types";

export type ListLoadProgress = {
  phase: "fetch" | "done";
  loaded: number;
  total: number;
  fetchingRow: boolean;
};

export type ListLoadCallbacks = {
  onProgress: (progress: ListLoadProgress) => void;
  onVersion: (version: string) => void;
  onListLoaded: (payload: InitPayload) => void;
  onError: (message: string) => void;
};

let loadGeneration = 0;

export function cancelListLoad(): void {
  loadGeneration += 1;
}

/** Один запрос getList → edoInit (как типовой список в 1С, без пагинации по мосту). */
export async function loadRegistryPaginated(callbacks: ListLoadCallbacks): Promise<void> {
  const generation = ++loadGeneration;
  const alive = () => generation === loadGeneration;

  try {
    callbacks.onProgress({ phase: "fetch", loaded: 0, total: 0, fetchingRow: true });

    const payload = await fetchRegistryList();
    if (!alive()) {
      return;
    }

    const items = payload.items ?? [];
    callbacks.onVersion(payload.version);
    callbacks.onListLoaded(payload);
    callbacks.onProgress({
      phase: "done",
      loaded: items.length,
      total: items.length,
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
