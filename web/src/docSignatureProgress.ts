import type { EpdListItem } from "./types";

/** Число «подписей» на значке документа (резерв секций). */
export function signatureSlotCount(docType: string): number {
  const t = docType.trim().toUpperCase();
  if (t === "ЭЗЗ" || t === "EZZ") {
    return 2;
  }
  if (t === "ЭТРН" || t === "ETRN" || t.includes("ЭТР")) {
    return 3;
  }
  return 3;
}

function titleIndexFromKey(key: string): number | null {
  const k = key.toLowerCase();
  if (k.includes("грузоотправ")) {
    return 0;
  }
  if (k.includes("грузополуч")) {
    return 2;
  }
  if (k.includes("перевозчик")) {
    if (k.includes("приём") || k.includes("прием")) {
      return 1;
    }
    return 1;
  }
  const m = key.match(/[TТ](\d+)/i);
  if (m) {
    return Math.max(0, parseInt(m[1], 10) - 1);
  }
  return null;
}

/** Какие секции подписи считаем выполненными (по титулам, шагу или проведению). */
export function signedSignatureSlots(item: EpdListItem): boolean[] {
  const n = signatureSlotCount(item.docType);
  const slots = Array.from({ length: n }, () => false);

  if (item.posted) {
    return Array.from({ length: n }, () => true);
  }

  if (item.titleDates?.length) {
    for (const entry of item.titleDates) {
      if (!entry.value) {
        continue;
      }
      const k = entry.key.toLowerCase();
      if (k.includes("перевозчик") && n >= 2) {
        slots[Math.min(1, n - 1)] = true;
        continue;
      }
      const idx = titleIndexFromKey(entry.key);
      if (idx !== null && idx < n) {
        slots[idx] = true;
      }
    }
    return slots;
  }

  const step = (item.currentStep || "").trim();
  const m = step.match(/[TТ](\d+)/i);
  let titleNum = m ? parseInt(m[1], 10) : 0;
  if (titleNum < 1 && item.currentStepDone) {
    titleNum = 1;
  }
  if (titleNum <= 0) {
    return slots;
  }

  const completedThrough = item.currentStepDone ? titleNum : titleNum - 1;
  for (let i = 0; i < n && i < completedThrough; i++) {
    slots[i] = true;
  }
  return slots;
}
