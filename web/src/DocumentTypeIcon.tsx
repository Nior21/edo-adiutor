type DocumentTypeIconProps = {
  docType: string;
  deletionMark?: boolean;
  posted?: boolean;
  stepDone?: boolean;
};

/** Заготовка «лист A4» в духе значка документа 1С (крест / галочка — позже доработаем). */
export function DocumentTypeIcon({ docType, deletionMark, posted, stepDone }: DocumentTypeIconProps) {
  const showCheck = posted || stepDone;
  const label = docType?.trim() || "…";

  return (
    <div
      className={`doc-type-icon ${deletionMark ? "doc-type-icon-deleted" : ""}`}
      title={deletionMark ? "Помечен на удаление" : docType}
      aria-hidden="true"
    >
      <svg className="doc-type-icon-svg" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="38" height="50" rx="3" className="doc-type-icon-sheet" />
        <path d="M26 1 L26 14 L39 14" className="doc-type-icon-fold" />
        {deletionMark ? (
          <g className="doc-type-icon-mark doc-type-icon-mark-delete">
            <circle cx="9" cy="9" r="7" fill="#fee4e2" stroke="#f04438" strokeWidth="1.2" />
            <path d="M6.5 6.5 L11.5 11.5 M11.5 6.5 L6.5 11.5" stroke="#d92d20" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        ) : null}
        {showCheck ? (
          <g className="doc-type-icon-mark doc-type-icon-mark-ok">
            <circle cx="33" cy="44" r="6" fill="#ecfdf3" stroke="#12b76a" strokeWidth="1" />
            <path d="M30 44 L32 46 L36 42" stroke="#027a48" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
      </svg>
      <span className="doc-type-icon-label">{label}</span>
    </div>
  );
}
