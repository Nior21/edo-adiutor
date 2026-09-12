import { useEffect, useRef, useState } from "react";
import {
  buildCalendarCells,
  formatSelectedDaysLabel,
  monthTitle,
  parseIso,
  toIso,
} from "./dateFilterUtils";
import { isoToday, saveStoredDays } from "./epdSearch";

type DateFilterProps = {
  selectedDays: Set<string>;
  daysWithData: Set<string>;
  onChange: (days: Set<string>) => void;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function DateFilter({ selectedDays, daysWithData, onChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date());
  const [anchor, setAnchor] = useState<string | null>(null);
  const linkRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const sortedDays = [...selectedDays].sort();
  const label = formatSelectedDaysLabel(sortedDays);
  const today = isoToday();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popRef.current?.contains(target) || linkRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const commitDays = (days: Set<string>) => {
    onChange(days);
    saveStoredDays(days);
  };

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const first = sortedDays[0];
    if (first) {
      const d = parseIso(first);
      if (d) {
        setView(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
    setOpen(true);
  };

  const onDayClick = (iso: string, event: React.MouseEvent) => {
    const next = new Set(selectedDays);

    if (event.shiftKey && anchor) {
      const a = anchor;
      const [lo, hi] = a < iso ? [a, iso] : [iso, a];
      if (!event.ctrlKey && !event.metaKey) {
        next.clear();
      }
      let cur = parseIso(lo);
      const end = parseIso(hi);
      while (cur && end && cur <= end) {
        next.add(toIso(cur));
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      }
    } else if (event.ctrlKey || event.metaKey) {
      if (next.has(iso)) {
        if (next.size > 1) {
          next.delete(iso);
        }
      } else {
        next.add(iso);
      }
      setAnchor(iso);
    } else {
      next.clear();
      next.add(iso);
      setAnchor(iso);
    }

    commitDays(next);
  };

  const pickMonth = () => {
    const y = view.getFullYear();
    const m = view.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    const next = new Set<string>();
    for (let day = 1; day <= last; day += 1) {
      next.add(`${y}-${pad2(m + 1)}-${pad2(day)}`);
    }
    setAnchor(`${y}-${pad2(m + 1)}-01`);
    commitDays(next);
  };

  const resetDays = () => {
    const next = new Set<string>();
    if (daysWithData.has(today)) {
      next.add(today);
    } else {
      const first = [...daysWithData].sort()[0];
      if (first) {
        next.add(first);
      }
    }
    commitDays(next);
  };

  const clearFilter = () => {
    commitDays(new Set());
    setOpen(false);
  };

  const popStyle = (() => {
    if (!linkRef.current) {
      return undefined;
    }
    const r = linkRef.current.getBoundingClientRect();
    const w = 280;
    let left = Math.min(r.right - w, window.innerWidth - w - 8);
    left = Math.max(8, left);
    let top = r.bottom + 6;
    if (top + 340 > window.innerHeight) {
      top = Math.max(8, r.top - 340);
    }
    return { left, top, width: w };
  })();

  return (
    <>
      <button
        ref={linkRef}
        type="button"
        className="date-filter-btn"
        onClick={toggleOpen}
        title="Клик — календарь · Shift — диапазон · Ctrl — несколько дат"
      >
        <svg className="date-filter-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="date-filter-label">{label}</span>
      </button>

      {open ? (
        <div ref={popRef} className="cal-pop" style={popStyle}>
          <div className="cal-head">
            <button type="button" className="icon-btn" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
              ‹
            </button>
            <div className="cal-title">{monthTitle(view)}</div>
            <button type="button" className="icon-btn" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
              ›
            </button>
          </div>
          <div className="cal-actions">
            <button type="button" className="cal-act" onClick={pickMonth}>
              Месяц
            </button>
            <button type="button" className="cal-act" onClick={resetDays}>
              Сегодня
            </button>
            <button type="button" className="cal-act" onClick={clearFilter}>
              Все даты
            </button>
          </div>
          <div className="cal-weekdays" aria-hidden="true">
            <span>пн</span>
            <span>вт</span>
            <span>ср</span>
            <span>чт</span>
            <span>пт</span>
            <span>сб</span>
            <span>вс</span>
          </div>
          <div className="cal-grid">
            {buildCalendarCells(view).map((cell) => (
              <button
                key={cell.iso}
                type="button"
                className={`cal-day${cell.out ? " out" : ""}${selectedDays.has(cell.iso) ? " selected" : ""}${daysWithData.has(cell.iso) ? " has-data" : ""}${cell.iso === today ? " today" : ""}`}
                onClick={(event) => onDayClick(cell.iso, event)}
              >
                {cell.day}
              </button>
            ))}
          </div>
          <p className="cal-hint">Клик — день · Shift — диапазон · Ctrl — добавить/убрать</p>
        </div>
      ) : null}
    </>
  );
}
