/** Одна виртуальная строка с реальной вёрсткой — пульсация через CSS (WebKit 1С). */
export function LoadingPlaceholderRow() {
  return (
    <tr className="loading-placeholder-row" aria-hidden="true">
      <td>
        <div className="doc-cell loading-shimmer">
          <div className="doc-line doc-line-head">
            <span className="doc-type-badge">ЭТрН</span>
            <span className="doc-num-wrap">
              № <span className="loading-text">0000000000</span>
            </span>
          </div>
          <div className="doc-line doc-line-meta">
            <span className="cell-muted loading-text">01.01.2025, 12:00</span>
          </div>
          <div className="doc-line doc-line-step">
            <span className="doc-step-name step-pending loading-text">Оформление</span>
          </div>
        </div>
      </td>
      <td>
        <div className="party-stack loading-shimmer">
          <span className="loading-text party-placeholder-name">ООО «Пример»</span>
          <span className="loading-text party-placeholder-inn">7700000000</span>
          <span className="loading-text party-placeholder-edo">2BM-0000000000</span>
        </div>
      </td>
      <td>
        <div className="party-stack loading-shimmer">
          <span className="loading-text party-placeholder-name">ООО «Перевозчик»</span>
          <span className="loading-text party-placeholder-inn">7700000001</span>
          <span className="loading-text party-placeholder-edo">2BM-0000000001</span>
        </div>
      </td>
      <td>
        <div className="party-stack loading-shimmer">
          <span className="loading-text party-placeholder-name">ООО «Получатель»</span>
          <span className="loading-text party-placeholder-inn">7700000002</span>
          <span className="loading-text party-placeholder-edo">2BM-0000000002</span>
        </div>
      </td>
      <td className="col-row-menu">
        <span className="row-menu-btn row-menu-btn-placeholder loading-text" aria-hidden="true">
          ⋮
        </span>
      </td>
    </tr>
  );
}
