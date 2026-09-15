type DocumentTypeIconProps = {
  docType: string;
  deletionMark?: boolean;
  signedSlots: boolean[];
};

/** Лист A4: скруглённый прямоугольник + загиб поверх (без «дырки» под углом). */
export function DocumentTypeIcon({ docType, deletionMark, signedSlots }: DocumentTypeIconProps) {
  const label = docType?.trim() || "…";
  const slotCount = signedSlots.length;

  const slotCentersX = (index: number): number => {
    if (slotCount <= 1) {
      return 20;
    }
    const margin = 10;
    const span = 40 - margin * 2;
    return margin + (span * index) / (slotCount - 1);
  };

  return (
    <div
      className={`doc-type-icon ${deletionMark ? "doc-type-icon-deleted" : ""}`}
      title={deletionMark ? "Помечен на удаление" : docType}
      aria-hidden="true"
    >
      <svg className="doc-type-icon-svg" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M 7 1 H 24 L 37 14 V 48 C 37 50.2 35.2 52 33 52 H 7 C 4.8 52 3 50.2 3 48 V 5 C 3 2.8 4.8 1 7 1 Z"
          className="doc-type-icon-sheet"
        />
        <path d="M 24 1 L 37 14 L 24 14 Z" className="doc-type-icon-fold" />
        <path d="M 24 1 L 37 14" className="doc-type-icon-fold-crease" />
        {deletionMark ? (
          <g className="doc-type-icon-mark doc-type-icon-mark-delete">
            <circle cx="9" cy="9" r="7" fill="#fee4e2" stroke="#f04438" strokeWidth="1.2" />
            <path d="M6.5 6.5 L11.5 11.5 M11.5 6.5 L6.5 11.5" stroke="#d92d20" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        ) : null}
        <g className="doc-type-icon-signatures">
          {signedSlots.map((signed, index) => {
            const cx = slotCentersX(index);
            const cy = 45;
            const r = slotCount > 2 ? 3.2 : 3.6;
            return (
              <g key={index} className={signed ? "doc-signature-signed" : "doc-signature-pending"}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  className="doc-signature-circle"
                  fill={signed ? "#ecfdf3" : "#fff"}
                  stroke={signed ? "#12b76a" : "#98a2b3"}
                  strokeWidth="1"
                />
                {signed ? (
                  <path
                    d={`M${cx - 1.8} ${cy} L${cx - 0.4} ${cy + 1.6} L${cx + 2.2} ${cy - 1.4}`}
                    stroke="#027a48"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
      <span className="doc-type-icon-label">{label}</span>
    </div>
  );
}
