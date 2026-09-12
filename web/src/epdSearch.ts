import { formatDate } from "./format";
import type { EpdListItem, PartyCell } from "./types";

const LS_QUERY = "pomoshchnik-edo-query";
const LS_DAYS = "pomoshchnik-edo-days";

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

function partyHaystack(party: PartyCell): string {
  return [party.name, party.inn, party.kpp, party.edoId].filter(Boolean).join(" ");
}

export function buildSearchHaystack(item: EpdListItem): string {
  const parts = [
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
    partyHaystack(item.shipper),
    partyHaystack(item.carrier),
    partyHaystack(item.consignee),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function filterItems(items: EpdListItem[], query: string, selectedDays: Set<string>): EpdListItem[] {
  const q = query.trim().toLowerCase();

  return items.filter((item) => {
    if (selectedDays.size > 0) {
      const key = itemDateKey(item);
      if (!key || !selectedDays.has(key)) {
        return false;
      }
    }
    if (!q) {
      return true;
    }
    return buildSearchHaystack(item).includes(q);
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

export function isoToday(): string {
  const t = new Date();
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
}
