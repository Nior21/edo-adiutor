import { useEffect, useRef } from "react";

import { DateFilter } from "./DateFilter";

import { saveStoredQuery } from "./epdSearch";

type TableSubheadProps = {
  metaText: string;
  listLoading: boolean;
  refreshActive: boolean;
  selectedDays: Set<string>;
  daysWithData: Set<string>;
  query: string;
  onQueryChange: (value: string) => void;
  onDaysChange: (days: Set<string>) => void;
  onRefresh: () => void;
};

export function TableSubhead({
  metaText,
  listLoading,
  refreshActive,
  selectedDays,
  daysWithData,
  query,
  onQueryChange,
  onDaysChange,
  onRefresh,
}: TableSubheadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showRefreshBusy = refreshActive || listLoading;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.code === "KeyF") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (event.code === "Escape" && document.activeElement === inputRef.current) {
        event.preventDefault();
        onQueryChange("");
        saveStoredQuery("");
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onQueryChange]);

  return (
    <div className="table-subhead">
      <DateFilter selectedDays={selectedDays} daysWithData={daysWithData} onChange={onDaysChange} />

      <input
        ref={inputRef}
        className="subhead-search"
        type="search"
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
          saveStoredQuery(event.target.value);
        }}
        placeholder="Поиск: номер, заявка, комментарий, ИНН…"
        autoComplete="off"
        spellCheck={false}
        title="Ctrl+F — фокус в поиск"
      />

      <span className="subhead-meta" title="Отображается после фильтров">
        {metaText}
      </span>

      <div className="subhead-actions">
        <button
          type="button"
          className={`button-ghost button-refresh${showRefreshBusy ? " is-busy" : ""}`}
          onClick={onRefresh}
          disabled={showRefreshBusy}
          aria-busy={showRefreshBusy}
          title="Обновить список"
        >
          <span className="button-refresh-icon" aria-hidden="true">
            <svg className="ico-refresh" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 12a8 8 0 1 1-2.34-5.66"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M20 4v5h-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="button-refresh-label">Обновить</span>
        </button>
      </div>
    </div>
  );
}
