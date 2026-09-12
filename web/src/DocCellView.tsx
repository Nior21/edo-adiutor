import { openDocument } from "./bridge";
import { Copyable } from "./Copyable";
import { ExternalLinkIcon } from "./ExternalLinkIcon";
import { formatDateShort } from "./format";
import type { FloatingMenuItem } from "./FloatingMenu";
import type { EpdListItem } from "./types";

type DocCellViewProps = {
  item: EpdListItem;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function DocCellView({ item, onCopied, onOpenMenu }: DocCellViewProps) {
  const handleOpenIn1C = () => {
    openDocument(item.ref, item.docType);
  };

  const openMenuItems: FloatingMenuItem[] = [
    { id: "open-doc", label: "Открыть в 1С", onSelect: handleOpenIn1C },
  ];

  const stepLabel = item.currentStep || "—";
  const stepStatus = item.currentStepDone ? "Шаг выполнен" : "Шаг не выполнен";
  const stepTitle = `${stepLabel} — ${stepStatus}`;

  return (
    <div className="doc-cell">
      <div className="doc-line doc-line-head">
        <span className="doc-type-badge" title={item.docTypeName}>
          {item.docType}
        </span>
        <span className="doc-num-wrap">
          №{" "}
          <Copyable
            value={item.number}
            inline
            mono
            className="doc-number-btn"
            onCopied={onCopied}
            onOpenMenu={onOpenMenu}
            extraMenuItems={[{ label: "Открыть в 1С", onSelect: handleOpenIn1C }]}
          />
        </span>
        {item.deletionMark ? <span className="chip chip-danger chip-inline">Удалён</span> : null}
        <ExternalLinkIcon
          onClick={handleOpenIn1C}
          title="Открыть документ в 1С"
          onOpenMenu={onOpenMenu}
          menuItems={openMenuItems}
        />
      </div>
      <div className="doc-line doc-line-meta">
        <span className="cell-muted">{item.date ? formatDateShort(item.date) : "—"}</span>
      </div>
      <div className="doc-line doc-line-step">
        <span
          className={`doc-step-name ${item.currentStepDone ? "step-done" : "step-pending"}`}
          title={stepTitle}
        >
          {stepLabel}
        </span>
      </div>
    </div>
  );
}
