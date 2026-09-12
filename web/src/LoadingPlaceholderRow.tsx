import { useJsPulse } from "./useJsPulse";

/** Одна виртуальная строка с реальной вёрсткой. JS-пульс (тест A) + CSS (тест F). */
export function LoadingPlaceholderRow() {
  const pulse = useJsPulse(true, 500);

  return (
    <tr className="loading-placeholder-row" aria-hidden="true">
      <td>
        <div className="doc-cell loading-shimmer">
          <div className="doc-line doc-line-head">
            <span className="doc-type-badge">ЭТрН</span>
            <span className="doc-num-wrap">
              № <span className={`loading-text anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>0000000000</span>
            </span>
          </div>
          <div className="doc-line doc-line-meta">
            <span className={`cell-muted loading-text anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
              01.01.2025, 12:00
            </span>
          </div>
          <div className="doc-line doc-line-step">
            <span
              className={`doc-step-name step-pending loading-text anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}
            >
              Оформление
            </span>
          </div>
        </div>
      </td>
      <td>
        <div className="party-stack loading-shimmer">
          <span className={`loading-text party-placeholder-name anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            ООО «Пример»
          </span>
          <span className={`loading-text party-placeholder-inn anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            7700000000
          </span>
          <span className={`loading-text party-placeholder-edo anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            2BM-0000000000
          </span>
        </div>
      </td>
      <td>
        <div className="party-stack loading-shimmer">
          <span className={`loading-text party-placeholder-name anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            ООО «Перевозчик»
          </span>
          <span className={`loading-text party-placeholder-inn anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            7700000001
          </span>
          <span className={`loading-text party-placeholder-edo anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            2BM-0000000001
          </span>
        </div>
      </td>
      <td>
        <div className="party-stack loading-shimmer">
          <span className={`loading-text party-placeholder-name anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            ООО «Получатель»
          </span>
          <span className={`loading-text party-placeholder-inn anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            7700000002
          </span>
          <span className={`loading-text party-placeholder-edo anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
            2BM-0000000002
          </span>
        </div>
      </td>
      <td className="col-row-menu">
        <span className={`row-menu-btn row-menu-btn-placeholder loading-text anim-lab-css-keyframes ${pulse ? "loading-text-bright" : ""}`}>
          ⋮
        </span>
      </td>
    </tr>
  );
}
