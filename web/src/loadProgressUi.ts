import type { ListLoadProgress } from "./listLoader";

export function isLoadActive(progress: ListLoadProgress | null): boolean {
  return progress !== null && progress.phase !== "done";
}

export function loadProgressPercent(progress: ListLoadProgress): number {
  if (progress.phase === "fetch") {
    return progress.fetchingRow ? 35 : 10;
  }
  return 100;
}

export function loadProgressLabel(progress: ListLoadProgress): string {
  if (progress.phase === "fetch") {
    return "Загрузка реестра…";
  }
  if (progress.total <= 0) {
    return "Реестр пуст";
  }
  return `Загружено: ${progress.total}`;
}
