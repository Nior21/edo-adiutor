const MONTHS_RU = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseIso(iso: string): Date | null {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    return null;
  }
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function formatIsoRu(iso: string): string {
  const d = parseIso(iso);
  if (!d) {
    return iso;
  }
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function formatIsoShort(iso: string): string {
  const d = parseIso(iso);
  if (!d) {
    return iso;
  }
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
}

function dayDiff(a: string, b: string): number {
  const da = parseIso(a);
  const db = parseIso(b);
  if (!da || !db) {
    return 0;
  }
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function compressRanges(days: string[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  let start = days[0];
  let prev = days[0];
  for (let i = 1; i < days.length; i += 1) {
    if (dayDiff(prev, days[i]) === 1) {
      prev = days[i];
      continue;
    }
    out.push([start, prev]);
    start = days[i];
    prev = days[i];
  }
  out.push([start, prev]);
  return out;
}

function isFullMonth(a: string, b: string): boolean {
  const da = parseIso(a);
  const db = parseIso(b);
  if (!da || !db) {
    return false;
  }
  if (da.getFullYear() !== db.getFullYear() || da.getMonth() !== db.getMonth()) {
    return false;
  }
  if (da.getDate() !== 1) {
    return false;
  }
  const last = new Date(da.getFullYear(), da.getMonth() + 1, 0).getDate();
  return db.getDate() === last;
}

export function formatSelectedDaysLabel(days: string[]): string {
  if (!days.length) {
    return "все даты";
  }
  if (days.length === 1) {
    return formatIsoRu(days[0]);
  }

  const ranges = compressRanges(days);
  if (ranges.length === 1 && ranges[0][0] !== ranges[0][1]) {
    const [a, b] = ranges[0];
    if (isFullMonth(a, b)) {
      const d = parseIso(a);
      return d ? `${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}` : `${formatIsoRu(a)} — ${formatIsoRu(b)}`;
    }
    return `${formatIsoRu(a)} — ${formatIsoRu(b)}`;
  }

  if (days.length > 6) {
    return `${days.length} дн. · ${formatIsoRu(days[0])} … ${formatIsoRu(days[days.length - 1])}`;
  }

  return ranges
    .map(([a, b]) => (a === b ? formatIsoRu(a) : `${formatIsoShort(a)}–${formatIsoShort(b)}`))
    .join(", ");
}

export function monthTitle(view: Date): string {
  return `${MONTHS_RU[view.getMonth()]} ${view.getFullYear()}`;
}

export function buildCalendarCells(view: Date): Array<{ iso: string; day: number; out: boolean }> {
  const y = view.getFullYear();
  const m = view.getMonth();
  const first = new Date(y, m, 1);
  const startPad = (first.getDay() + 6) % 7;
  const gridStart = new Date(y, m, 1 - startPad);
  const cells: Array<{ iso: string; day: number; out: boolean }> = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      iso: toIso(d),
      day: d.getDate(),
      out: d.getMonth() !== m,
    });
  }
  return cells;
}

export { MONTHS_RU };
