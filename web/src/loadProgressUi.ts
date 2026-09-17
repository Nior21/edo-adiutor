import type { ListLoadProgress } from "./listLoader";

const META_SHARE = 5;

export function isLoadActive(progress: ListLoadProgress | null): boolean {
  return progress !== null && progress.phase !== "done";
}

export function loadProgressPercent(progress: ListLoadProgress): number {
  if (progress.phase === "meta") {
    return 1;
  }

  if (progress.total <= 0) {
    return progress.phase === "done" ? 100 : META_SHARE;
  }

  if (progress.phase === "pages") {
    const share = 100 - META_SHARE;
    return META_SHARE + (progress.loaded / progress.total) * share;
  }

  return 100;
}

export function loadProgressLabel(progress: ListLoadProgress): string {
  if (progress.phase === "meta") {
    return "Подготовка загрузки…";
  }

  if (progress.total <= 0) {
    return "Реестр пуст";
  }

  if (progress.phase === "pages") {
    return `Реестр: ${progress.loaded} из ${progress.total}`;
  }

  return `Загружено: ${progress.total}`;
}
