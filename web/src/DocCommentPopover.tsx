import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

type DocCommentPopoverProps = {
  open: boolean;
  text: string;
  rowRef: RefObject<HTMLTableRowElement | null>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

type PopoverLayout = {
  left: number;
  width: number;
  top: number;
  maxHeight: number;
  placement: "below" | "above";
};

function measureRow(rowEl: HTMLTableRowElement | null): PopoverLayout | null {
  if (!rowEl || typeof window === "undefined") {
    return null;
  }
  const rowRect = rowEl.getBoundingClientRect();
  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  const margin = 8;
  const gap = 4;
  const spaceBelow = viewportH - rowRect.bottom - margin;
  const spaceAbove = rowRect.top - margin;
  const placement = spaceBelow >= spaceAbove ? "below" : "above";
  const maxHeight = Math.max(72, Math.min(320, placement === "below" ? spaceBelow - gap : spaceAbove - gap));
  const top = placement === "below" ? rowRect.bottom + gap : rowRect.top - gap;
  return {
    left: rowRect.left,
    width: rowRect.width,
    top,
    maxHeight,
    placement,
  };
}

/** Текст [!] по ширине строки таблицы; вниз или вверх от строки. */
export function DocCommentPopover({ open, text, rowRef, onMouseEnter, onMouseLeave }: DocCommentPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PopoverLayout | null>(null);
  const [adjustedTop, setAdjustedTop] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setLayout(null);
      setAdjustedTop(null);
      return;
    }
    const base = measureRow(rowRef.current);
    setLayout(base);
    setAdjustedTop(null);
  }, [open, text, rowRef]);

  useLayoutEffect(() => {
    const rowEl = rowRef.current;
    if (!open || !layout || !panelRef.current || !rowEl) {
      return;
    }
    const panelH = panelRef.current.offsetHeight;
    const rowRect = rowEl.getBoundingClientRect();
    const margin = 8;
    const gap = 4;
    if (layout.placement === "below") {
      const bottom = layout.top + panelH;
      if (bottom > window.innerHeight - margin) {
        setAdjustedTop(Math.max(margin, rowRect.top - gap - panelH));
      }
    } else {
      const topEdge = layout.top - panelH;
      if (topEdge < margin) {
        setAdjustedTop(rowRect.bottom + gap);
      } else {
        setAdjustedTop(rowRect.top - gap - panelH);
      }
    }
  }, [open, layout, rowRef, text]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const update = () => setLayout(measureRow(rowRef.current));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, rowRef]);

  if (!open || !layout) {
    return null;
  }

  const body = text.trim()
    ? text
    : "Метка «в фокус» ([!]). Подробный комментарий можно дописать в карточке документа.";

  const style = {
    left: layout.left,
    width: layout.width,
    top: adjustedTop ?? layout.top,
    maxHeight: layout.maxHeight,
  };

  return createPortal(
    <div
      ref={panelRef}
      className="doc-comment-popover"
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      role="tooltip"
    >
      <div className="doc-comment-popover-inner">{body}</div>
    </div>,
    document.body,
  );
}
