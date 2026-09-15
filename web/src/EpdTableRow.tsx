import { useEffect, useRef, useState, type MouseEvent } from "react";
import { DocCellView } from "./DocCellView";
import { PartyCellView } from "./PartyCellView";
import { RowContextMenu, type RowContextMenuHandle } from "./RowContextMenu";
import { shouldShowCommentWorkRail } from "./commentDisplay";
import type { FloatingMenuItem } from "./FloatingMenu";
import type { EpdListItem } from "./types";

type EpdTableRowProps = {
  item: EpdListItem;
  active: boolean;
  enrichingEdo?: boolean;
  onOpen: (ref: string) => void;
  onCopied: (value: string) => void;
  onOpenMenu: (x: number, y: number, items: FloatingMenuItem[]) => void;
};

export function EpdTableRow({ item, active, enrichingEdo = false, onOpen, onCopied, onOpenMenu }: EpdTableRowProps) {
  const menuRef = useRef<RowContextMenuHandle>(null);
  const trRef = useRef<HTMLTableRowElement>(null);
  const [rowWidthPx, setRowWidthPx] = useState(0);
  const [rowHeightPx, setRowHeightPx] = useState(0);

  useEffect(() => {
    const el = trRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      return;
    }
    const apply = (width: number, height: number) => {
      if (width > 0) {
        setRowWidthPx(width);
      }
      if (height > 0) {
        setRowHeightPx(height);
      }
    };
    apply(el.getBoundingClientRect().width, el.getBoundingClientRect().height);
    const ro = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) {
        apply(box.width, box.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleRowContextMenu = (event: MouseEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    event.stopPropagation();
    menuRef.current?.openAt(event.clientX, event.clientY);
  };

  const handleMenuCellClick = (event: MouseEvent<HTMLTableCellElement>) => {
    event.stopPropagation();
  };

  const showCommentRail = shouldShowCommentWorkRail(item.comment);

  return (
    <tr
      ref={trRef}
      className={`${item.deletionMark ? "row-deleted" : ""} ${active ? "row-active" : ""}${showCommentRail ? " row-has-comment-rail" : ""}`}
      onClick={() => onOpen(item.ref)}
      onContextMenu={handleRowContextMenu}
    >
      <td className="col-doc-cell">
        <DocCellView
          item={item}
          rowWidthPx={rowWidthPx}
          rowHeightPx={rowHeightPx}
          onCopied={onCopied}
          onOpenMenu={onOpenMenu}
        />
      </td>
      <td>
        <PartyCellView
          party={item.shipper}
          organizationRef={item.organizationRef ?? ""}
          enrichingEdo={enrichingEdo}
          onCopied={onCopied}
          onOpenMenu={onOpenMenu}
        />
      </td>
      <td>
        <PartyCellView
          party={item.carrier}
          organizationRef={item.organizationRef ?? ""}
          enrichingEdo={enrichingEdo}
          onCopied={onCopied}
          onOpenMenu={onOpenMenu}
        />
      </td>
      <td>
        <PartyCellView
          party={item.consignee}
          organizationRef={item.organizationRef ?? ""}
          enrichingEdo={enrichingEdo}
          onCopied={onCopied}
          onOpenMenu={onOpenMenu}
        />
      </td>
      <td className="col-row-menu" onClick={handleMenuCellClick}>
        <RowContextMenu ref={menuRef} item={item} onCopied={onCopied} onOpenMenu={onOpenMenu} />
      </td>
    </tr>
  );
}
