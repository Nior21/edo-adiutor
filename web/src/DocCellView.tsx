import { useCallback, useRef, useState, type RefObject } from "react";
import { openDocument } from "./bridge";
import { commentTextForDisplay, shouldShowCommentWorkRail } from "./commentDisplay";
import { Copyable } from "./Copyable";
import { DocCommentPopover } from "./DocCommentPopover";
import { DocumentTypeIcon } from "./DocumentTypeIcon";
import { signedSignatureSlots } from "./docSignatureProgress";
import { ExternalLinkIcon } from "./ExternalLinkIcon";
import { formatDateShort } from "./format";
import type { FloatingMenuItem } from "./FloatingMenu";
import type { EpdListItem } from "./types";

type DocCellViewProps = {
  item: EpdListItem;
  rowRef: RefObject<HTMLTableRowElement | null>;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function DocCellView({ item, rowRef, onCopied, onOpenMenu }: DocCellViewProps) {
  const closeTimerRef = useRef<number | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);

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
  const showWorkComment = shouldShowCommentWorkRail(item.comment);
  const commentText = commentTextForDisplay(item.comment);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openComment = useCallback(() => {
    clearCloseTimer();
    if (showWorkComment) {
      setCommentOpen(true);
    }
  }, [clearCloseTimer, showWorkComment]);

  const scheduleCloseComment = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setCommentOpen(false), 120);
  }, [clearCloseTimer]);

  return (
    <div className="doc-row-shell">
      <div
        className={`doc-icon-slot${showWorkComment ? " doc-icon-slot-has-comment" : ""}`}
        onMouseEnter={openComment}
        onMouseLeave={scheduleCloseComment}
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
      <DocCommentPopover
        open={commentOpen && showWorkComment}
        text={commentText}
        rowRef={rowRef}
        onMouseEnter={openComment}
        onMouseLeave={scheduleCloseComment}
      />
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

