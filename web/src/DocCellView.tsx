import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { openDocument } from "./bridge";
import { commentTextForDisplay, shouldShowCommentWorkRail } from "./commentDisplay";
import { Copyable } from "./Copyable";
import { DocCommentRail } from "./DocCommentRail";
import { DocumentTypeIcon } from "./DocumentTypeIcon";
import { signedSignatureSlots } from "./docSignatureProgress";
import { ExternalLinkIcon } from "./ExternalLinkIcon";
import { formatDateShort } from "./format";
import type { FloatingMenuItem } from "./FloatingMenu";
import type { EpdListItem } from "./types";

type DocCellViewProps = {
  item: EpdListItem;
  rowWidthPx: number;
  rowHeightPx: number;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function DocCellView({ item, rowWidthPx, rowHeightPx, onCopied, onOpenMenu }: DocCellViewProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [railExpanded, setRailExpanded] = useState(false);

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
  const showCommentRail = shouldShowCommentWorkRail(item.comment);
  const commentText = commentTextForDisplay(item.comment);

  const iconHeightPx = rowHeightPx > 0 ? Math.max(28, rowHeightPx - 6) : undefined;
  const expandWidthPx = rowWidthPx > 0 ? rowWidthPx * 0.5 : 0;

  const handleShellMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    const shell = shellRef.current;
    const related = event.relatedTarget;
    if (shell && related instanceof Node && shell.contains(related)) {
      return;
    }
    setRailExpanded(false);
  };

  return (
    <div
      ref={shellRef}
      className={`doc-row-shell${railExpanded ? " doc-row-rail-expanded" : ""}`}
      style={iconHeightPx ? ({ ["--doc-icon-h" as string]: `${iconHeightPx}px` } as CSSProperties) : undefined}
      onMouseLeave={handleShellMouseLeave}
    >
      {showCommentRail ? (
        <DocCommentRail commentText={commentText} expanded={railExpanded} expandWidthPx={expandWidthPx} />
      ) : null}
      <div
        className={`doc-left-zone${showCommentRail ? " doc-left-zone-with-rail" : ""}`}
        onMouseEnter={() => {
          if (showCommentRail) {
            setRailExpanded(true);
          }
        }}
      >
        <DocumentTypeIcon docType={item.docType} deletionMark={item.deletionMark} signedSlots={signedSlots} />
      </div>
      <div className="doc-cell-body">
        <div className="doc-line doc-line-head">
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
