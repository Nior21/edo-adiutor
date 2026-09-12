const COLUMNS = ["Документ", "Грузоотправитель", "Грузополучатель", "Перевозчик", "Шаг", "Статус"];

type TableSkeletonProps = {
  rows?: number;
};

export function TableSkeleton({ rows = 14 }: TableSkeletonProps) {
  return (
    <table className="epd-table epd-table-skeleton" aria-hidden="true">
      <thead>
        <tr>
          {COLUMNS.map((title) => (
            <th key={title}>{title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {COLUMNS.map((title, colIndex) => (
              <td key={`${rowIndex}-${title}`}>
                <span
                  className={`shimmer-block ${colIndex >= 1 && colIndex <= 3 ? "shimmer-block-tall" : ""}`}
                  style={{ animationDelay: `${(rowIndex * 60 + colIndex * 40) % 600}ms` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
