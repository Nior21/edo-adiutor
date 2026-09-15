import type { EpdListItem } from "./types";

export function refsInVisibleRange(
  visibleItems: EpdListItem[],
  anchorRef: string,
  targetRef: string,
): string[] {
  const anchorIdx = visibleItems.findIndex((row) => row.ref === anchorRef);
  const targetIdx = visibleItems.findIndex((row) => row.ref === targetRef);
  if (anchorIdx < 0 || targetIdx < 0) {
    return [targetRef];
  }
  const from = Math.min(anchorIdx, targetIdx);
  const to = Math.max(anchorIdx, targetIdx);
  return visibleItems.slice(from, to + 1).map((row) => row.ref);
}

export function itemsByRefs(allItems: EpdListItem[], refs: Iterable<string>): EpdListItem[] {
  const wanted = new Set(refs);
  return allItems.filter((row) => wanted.has(row.ref));
}
