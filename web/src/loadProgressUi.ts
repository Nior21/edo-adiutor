import type { ListLoadProgress } from "./listLoader";

const META_SHARE = 3;
const REGISTRY_SHARE = 47;
const ENRICH_SHARE = 50;

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
    const rowShare = REGISTRY_SHARE / progress.total;
    return META_SHARE + progress.loaded * rowShare;
  }

  if (progress.phase === "enrich") {
    const enrichShare = ENRICH_SHARE / progress.total;
    return META_SHARE + REGISTRY_SHARE + progress.enriched * enrichShare;
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
    const next = Math.min(progress.loaded + 1, progress.total);
    return `Реестр: ${next} из ${progress.total}`;
  }

  if (progress.phase === "enrich") {
    const next = Math.min(progress.enriched + 1, progress.total);
    return `ЭДО и статусы: ${next} из ${progress.total}`;
  }

  return `Загружено: ${progress.total}`;
}
