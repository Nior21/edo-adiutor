import { commentTextForDisplay } from "./commentDisplay";
import { formatDate } from "./format";
import type { EpdListItem, PartyCell } from "./types";

const LS_QUERY = "pomoshchnik-edo-query";
const LS_DAYS = "pomoshchnik-edo-days";
const LS_SHOW_ALL = "pomoshchnik-edo-show-all";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function itemDateKey(item: EpdListItem): string {
  if (!item.date) {
    return "";
  }
  const d = new Date(item.date);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function normalizeSearchKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/-/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, "");
}

function partyHaystack(party: PartyCell): string {
  return [party.name, party.inn, party.kpp, party.edoId, party.entityRef ?? ""].filter(Boolean).join(" ");
}

function joinArray(values: string[] | undefined): string {
  if (!values?.length) {
    return "";
  }
  return values.join(" ");
}

export function buildSearchHaystack(item: EpdListItem): string {
  const parts = [
    item.ref,
    item.searchIndex,
    item.organizationRef,
    item.organizationEdoId,
    item.uidMintrans,
    item.otherRecipients,
    joinArray(item.docFlowIds),
    joinArray(item.edoDocumentRefs),
    joinArray(item.partyEdoIds),
    joinArray(item.titleFileIds),
    item.docType,
    item.docTypeName,
    item.number,
    item.ibNumber,
    item.date ? formatDate(item.date) : "",
    item.organization,
    item.currentStep,
    item.currentStepDone ? "выполнен" : "не выполнен",
    item.deletionMark ? "удалён" : "",
    item.comment,
    commentTextForDisplay(item.comment),
    item.waybillNumber,
    partyHaystack(item.shipper),
    partyHaystack(item.carrier),
    partyHaystack(item.consignee),
  ];
  return parts.filter(Boolean).join(" ");
}

function itemMatchesQuery(item: EpdListItem, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) {
    return true;
  }
  const haystack = buildSearchHaystack(item);
  const hayLower = haystack.toLowerCase();
  const qLower = trimmed.toLowerCase();
  if (hayLower.includes(qLower)) {
    return true;
  }
  const hayNorm = normalizeSearchKey(haystack);
  const qNorm = normalizeSearchKey(trimmed);
  return qNorm.length > 0 && hayNorm.includes(qNorm);
}

export function filterItems(items: EpdListItem[], query: string, selectedDays: Set<string>): EpdListItem[] {
  return items.filter((item) => {
    if (selectedDays.size > 0) {
      const key = itemDateKey(item);
      if (!key || !selectedDays.has(key)) {
        return false;
      }
    }
    return itemMatchesQuery(item, query);
  });
}

export function daysWithItems(items: EpdListItem[]): Set<string> {
  const days = new Set<string>();
  for (const item of items) {
    const key = itemDateKey(item);
    if (key) {
      days.add(key);
    }
  }
  return days;
}

export function loadStoredQuery(): string {
  try {
    return localStorage.getItem(LS_QUERY) ?? "";
  } catch {
    return "";
  }
}

export function saveStoredQuery(query: string): void {
  try {
    localStorage.setItem(LS_QUERY, query);
  } catch {
    /* ignore */
  }
}

export function loadStoredDays(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DAYS);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveStoredDays(days: Set<string>): void {
  try {
    localStorage.setItem(LS_DAYS, JSON.stringify([...days].sort()));
  } catch {
    /* ignore */
  }
}

export function loadStoredShowAll(): boolean {
  try {
    return localStorage.getItem(LS_SHOW_ALL) === "1";
  } catch {
    return false;
  }
}

export function saveStoredShowAll(showAll: boolean): void {
  try {
    localStorage.setItem(LS_SHOW_ALL, showAll ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function isoToday(): string {
  const t = new Date();
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
}
