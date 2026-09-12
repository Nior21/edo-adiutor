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
  onAnimTest: () => void;
  animTestActive: boolean;
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
  onAnimTest,
  animTestActive,
}: TableSubheadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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
        placeholder="Поиск: номер, контрагент, ИНН, шаг…"
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
          className={`button-ghost button-anim-test${animTestActive ? " is-active" : ""}`}
          onClick={onAnimTest}
          title="Показать тестовые анимации загрузки на 8 секунд"
        >
          Тест аним. 8с
        </button>
        <button
          type="button"
          className={`button-ghost button-refresh${refreshActive ? " is-busy" : ""}`}
          onClick={onRefresh}
          aria-busy={refreshActive}
          title="Обновить список"
        >
          <svg className="ico-refresh" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.6-6.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Обновить
        </button>
      </div>
    </div>
  );
}
