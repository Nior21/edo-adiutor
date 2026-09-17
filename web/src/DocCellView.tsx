import { openDocument } from "./bridge";
import { shouldShowCommentWorkRail } from "./commentDisplay";
import { Copyable } from "./Copyable";
import { DocumentTypeIcon } from "./DocumentTypeIcon";
import { signedSignatureSlots } from "./docSignatureProgress";
import { ExternalLinkIcon } from "./ExternalLinkIcon";
import { formatDateShort } from "./format";
import type { FloatingMenuItem } from "./FloatingMenu";
import type { EpdListItem } from "./types";

type DocCellViewProps = {
  item: EpdListItem;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};


function validationBadge(item: EpdListItem): { className: string; title: string } | null {
  const summary = item.validationSummary;
  if (!summary) {
    return null;
  }
  if (summary.errorCount > 0) {
    return { className: "validation-badge validation-badge-error", title: `Ошибки проверки: ${summary.errorCount}` };
  }
  if (summary.warnCount > 0) {
    return { className: "validation-badge validation-badge-warn", title: `Предупреждения: ${summary.warnCount}` };
  }
  if (summary.externalCount > 0) {
    return { className: "validation-badge validation-badge-external", title: `Нужна внешняя проверка: ${summary.externalCount}` };
  }
  if (summary.ok) {
    return { className: "validation-badge validation-badge-ok", title: "Проверки пройдены" };
  }
  return null;
}

export function DocCellView({ item, onCopied, onOpenMenu }: DocCellViewProps) {
  const handleOpenIn1C = () => {
    openDocument(item.ref, item.docType);
  };

  const openMenuItems: FloatingMenuItem[] = [
    { id: "open-doc", label: "Открыть в 1С", onSelect: handleOpenIn1C },
  ];

  const stepLabel = item.currentStep || "-";
  const stepStatus = item.currentStepDone ? "Шаг выполнен" : "Шаг не выполнен";
  const stepTitle = `${stepLabel} - ${stepStatus}`;

  const signedSlots = signedSignatureSlots(item);
  const badge = validationBadge(item);
  const showWorkComment = shouldShowCommentWorkRail(item.comment);

  return (
    <div className="doc-row-shell">
      <div
        className={`doc-icon-slot${showWorkComment ? " doc-icon-slot-has-comment" : ""}`}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <DocumentTypeIcon
          docType={item.docType}
          deletionMark={item.deletionMark}
          signedSlots={signedSlots}
          workComment={showWorkComment}
        />
      </div>
      <div className="doc-cell-body">
        <div className="doc-line doc-line-head">
          {badge ? <span className={badge.className} title={badge.title} aria-label={badge.title} /> : null}
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
          <ExternalLinkIcon
            onClick={handleOpenIn1C}
            title="Открыть документ в 1С"
            onOpenMenu={onOpenMenu}
            menuItems={openMenuItems}
          />
        </div>
        <div className="doc-line doc-line-meta">
          <span className="cell-muted">{item.date ? formatDateShort(item.date) : "-"}</span>
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
    </div>
  );
}

