import { signedSignatureSlots } from "./docSignatureProgress";
import type { EpdListItem } from "./types";

/** Завершён или снят с учёта — не «в работе» для фильтра списка. */
export function isEpdRowInactive(item: EpdListItem): boolean {
  if (item.deletionMark || item.posted) {
    return true;
  }
  const slots = signedSignatureSlots(item);
  return slots.length > 0 && slots.every(Boolean);
}
